import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Known Costa Rica reference locations for instant, resilient offline/fast geocoding
const CR_PRESETS: Record<string, { lat: number; lng: number; name: string }> = {
  "pozos": { lat: 9.9482, lng: -84.1967, name: "Calle 34, Pozos, Santa Ana" },
  "calle 34": { lat: 9.9482, lng: -84.1967, name: "Calle 34, Pozos, Santa Ana" },
  "santa ana": { lat: 9.9326, lng: -84.1825, name: "Santa Ana Centro" },
  "lindora": { lat: 9.9405, lng: -84.1923, name: "Lindora, Santa Ana" },
  "escazu": { lat: 9.9176, lng: -84.1378, name: "Escazú, San José" },
  "san antonio de belen": { lat: 9.9798, lng: -84.1843, name: "San Antonio de Belén, Heredia" },
  "belen": { lat: 9.9798, lng: -84.1843, name: "Belén, Heredia" },
  "alajuela": { lat: 10.0163, lng: -84.2116, name: "Alajuela Centro" },
  "la guacima": { lat: 9.9806, lng: -84.2678, name: "La Guácima, Alajuela" },
  "guacima": { lat: 9.9806, lng: -84.2678, name: "La Guácima, Alajuela" },
  "heredia": { lat: 10.0024, lng: -84.1165, name: "Heredia Centro" },
  "san jose": { lat: 9.9333, lng: -84.0833, name: "San José Centro" },
  "san pedro": { lat: 9.9288, lng: -84.0531, name: "San Pedro, Montes de Oca" },
  "curridabat": { lat: 9.9142, lng: -84.0354, name: "Curridabat, San José" },
  "cartago": { lat: 9.8644, lng: -83.9194, name: "Cartago Centro" },
  "atenas": { lat: 9.9772, lng: -84.3822, name: "Atenas, Alajuela" },
  "orotina": { lat: 9.9114, lng: -84.5236, name: "Orotina, Alajuela" },
  "jaco": { lat: 9.6150, lng: -84.6298, name: "Jacó, Garabito, Puntarenas" },
  "quepos": { lat: 9.4319, lng: -84.1619, name: "Quepos / Manuel Antonio" },
  "puntarenas": { lat: 9.9763, lng: -84.8384, name: "Puntarenas Centro" },
  "san carlos": { lat: 10.3238, lng: -84.4271, name: "Ciudad Quesada, San Carlos" },
  "la fortuna": { lat: 10.4716, lng: -84.6453, name: "La Fortuna, San Carlos" },
  "perez zeledon": { lat: 9.3739, lng: -83.7083, name: "San Isidro de El General, Pérez Zeledón" },
  "liberia": { lat: 10.6350, lng: -85.4377, name: "Liberia, Guanacaste" },
  "tamarindo": { lat: 10.2993, lng: -85.8400, name: "Tamarindo, Guanacaste" },
  "nosara": { lat: 9.9806, lng: -85.6517, name: "Nosara, Guanacaste" },
  "guapiles": { lat: 10.2167, lng: -83.7833, name: "Guápiles, Pococí, Limón" },
  "limon": { lat: 9.9907, lng: -83.0360, name: "Limón Centro" },
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Haversine formula for great-circle distance in kilometers
 */
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * POST /api/logistics/calculate
 * Computes exact road distance, duration, and prices for Pick-up, Delivery, and Home Installation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination, destLat, destLng } = body;

    // Fetch active rate configuration from DB
    const config = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
    });

    const originLat = config ? config.garageLatitude : 9.9482;
    const originLng = config ? config.garageLongitude : -84.1967;
    const originAddress = (config && config.garageAddress) || "Calle 34, Pozos, Santa Ana, San José, Costa Rica";

    let targetLat =
      typeof destLat === "number"
        ? destLat
        : typeof body.lat === "number"
        ? body.lat
        : null;
    let targetLng =
      typeof destLng === "number"
        ? destLng
        : typeof body.lng === "number"
        ? body.lng
        : null;
    let resolvedDestinationName = typeof destination === "string" ? destination.trim() : "";

    // 1. Resolve coordinates if not provided directly
    if (targetLat === null || targetLng === null) {
      if (!resolvedDestinationName || resolvedDestinationName.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Ingresa una ubicación más precisa (al menos 3 caracteres)",
          },
          { status: 400 }
        );
      }

      const normalizedQuery = normalizeString(resolvedDestinationName);

      // Check presets with strict word boundary or exact match
      let matchedPreset = Object.entries(CR_PRESETS).find(([key]) => {
        if (normalizedQuery === key) return true;
        const regex = new RegExp(`(^|\\s)${key}(\\s|$)`, "i");
        return regex.test(normalizedQuery);
      });

      if (matchedPreset) {
        targetLat = matchedPreset[1].lat;
        targetLng = matchedPreset[1].lng;
        if (!resolvedDestinationName || resolvedDestinationName.length < 4) {
          resolvedDestinationName = matchedPreset[1].name;
        }
      } else {
        // Fallback: Query Nominatim with Costa Rica country code constraint
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              resolvedDestinationName + ", Costa Rica"
            )}&countrycodes=cr&limit=1`,
            {
              headers: { "User-Agent": "ZxZMods-Logistics-Platform/1.0" },
              signal: AbortSignal.timeout(2500),
            }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              targetLat = parseFloat(geoData[0].lat);
              targetLng = parseFloat(geoData[0].lon);
              resolvedDestinationName = geoData[0].display_name.split(",")[0] || resolvedDestinationName;
            }
          }
        } catch (geoErr) {
          console.warn("Geocoding lookup timed out or failed:", geoErr);
        }
      }
    }

    if (targetLat === null || targetLng === null) {
      return NextResponse.json(
        { success: false, error: "No se pudieron determinar las coordenadas de destino" },
        { status: 400 }
      );
    }

    const finalLat: number = targetLat;
    const finalLng: number = targetLng;

    // 2. Reverse geocode (if needed) & Compute road route geometry concurrently in parallel
    let roadDistanceKm = 0;
    let durationMinutes = 0;
    let isOsrmRoute = false;
    let routeGeometry: [number, number][] = [];

    const shouldReverseGeocode =
      !resolvedDestinationName || resolvedDestinationName.includes(",");

    const revGeocodePromise = shouldReverseGeocode
      ? fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLng}&zoom=18&addressdetails=1`,
          {
            headers: { "User-Agent": "ZxZMods-Logistics-Platform/1.0" },
            signal: AbortSignal.timeout(2500),
          }
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    const osrmPromise = fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${finalLng},${finalLat}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(3500) }
    )
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    const [revData, osrmData] = await Promise.all([revGeocodePromise, osrmPromise]);

    if (revData && revData.address) {
      const addr = revData.address;
      const poi = revData.name || addr.amenity || addr.shop || addr.building || addr.tourism || "";
      const road = addr.road || addr.pedestrian || addr.footway || "";
      const city = addr.county || addr.town || addr.city || addr.suburb || addr.village || "";
      if (poi && road) {
        resolvedDestinationName = `${poi}, ${road}, ${city}`;
      } else if (poi) {
        resolvedDestinationName = `${poi}, ${city}`;
      } else if (road) {
        resolvedDestinationName = `${road}, ${city}`;
      } else if (revData.display_name) {
        resolvedDestinationName = revData.display_name.split(",").slice(0, 3).join(", ");
      }
    }

    if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
      const route = osrmData.routes[0];
      roadDistanceKm = Math.round((route.distance / 1000) * 10) / 10; // km with 1 decimal
      durationMinutes = Math.max(3, Math.round(route.duration / 60)); // minutes
      isOsrmRoute = true;

      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      if (route.geometry && Array.isArray(route.geometry.coordinates)) {
        routeGeometry = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      }
    }

    // Fallback if OSRM failed or timed out: Haversine * 1.28 (Costa Rica winding road factor)
    if (!isOsrmRoute || roadDistanceKm <= 0) {
      const straightLineKm = calculateHaversineKm(originLat, originLng, finalLat, finalLng);
      roadDistanceKm = Math.max(1.5, Math.round(straightLineKm * 1.28 * 10) / 10);
      durationMinutes = Math.max(3, Math.round((roadDistanceKm / 42) * 60));
      routeGeometry = [
        [originLat, originLng],
        [finalLat, finalLng],
      ];
    }

    // 3. Calculate service prices according to current DB rates
    const pickupRate = config?.pickupRatePerKmCRC || 1500;
    const deliveryRate = config?.deliveryRatePerKmCRC || 800;
    const homeInstallRate = config?.homeInstallationRatePerKmCRC || 2000;

    const pickupBase = config?.pickupBaseFeeCRC || 10000;
    const deliveryBase = config?.deliveryBaseFeeCRC || 3000;
    const homeInstallBase = config?.homeInstallationBaseFeeCRC || 15000;

    const pickupCostCRC = pickupBase + Math.round(roadDistanceKm * pickupRate);
    const deliveryCostCRC = deliveryBase + Math.round(roadDistanceKm * deliveryRate);
    const homeInstallationCostCRC = homeInstallBase + Math.round(roadDistanceKm * homeInstallRate);

    // Google Maps & Waze links
    const googleMapsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(
      originAddress
    )}&daddr=${finalLat},${finalLng}&output=embed`;

    const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originAddress
    )}&destination=${finalLat},${finalLng}`;

    const wazeUrl = `https://waze.com/ul?ll=${finalLat},${finalLng}&navigate=yes`;

    return NextResponse.json({
      success: true,
      data: {
        origin: {
          address: originAddress,
          lat: originLat,
          lng: originLng,
        },
        destination: {
          address: resolvedDestinationName,
          lat: finalLat,
          lng: finalLng,
        },
        distanceKm: roadDistanceKm,
        durationMinutes,
        rates: {
          pickupRatePerKmCRC: pickupRate,
          deliveryRatePerKmCRC: deliveryRate,
          homeInstallationRatePerKmCRC: homeInstallRate,
          pickupBaseFeeCRC: pickupBase,
          deliveryBaseFeeCRC: deliveryBase,
          homeInstallationBaseFeeCRC: homeInstallBase,
        },
        costs: {
          pickupCostCRC,
          deliveryCostCRC,
          homeInstallationCostCRC,
        },
        geometry: routeGeometry,
        googleMapsEmbedUrl,
        googleMapsDirectionsUrl,
        wazeUrl,
      },
    });
  } catch (error) {
    console.error("Error calculating logistics route:", error);
    return NextResponse.json(
      { success: false, error: "Error al calcular la ruta y distancias" },
      { status: 500 }
    );
  }
}
