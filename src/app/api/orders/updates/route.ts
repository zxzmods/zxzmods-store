import { fetchOrderUpdatesResponse } from "@/lib/orderUpdates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return fetchOrderUpdatesResponse(request);
}
