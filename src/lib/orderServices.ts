/**
 * Utilities for service scheduling and pending installation cost calculations.
 */

export interface OrderLike {
  id?: string;
  orderNumber?: string;
  itemsJson?: string | null;
  installationCostCRC?: number | null;
  laborSubtotalCRC?: number | null;
  partsSubtotalCRC?: number | null;
  totalCRC?: number | null;
}

/**
 * Calculates the installation cost set on an order that was not charged during cart checkout.
 * Per project rule, cart checkout never charges installation (laborSubtotalCRC is left 0 or not included in totalCRC),
 * so when scheduling:
 * - home installation ('installation')
 * - only install ('shop_installation')
 * - pick-up ('pickup')
 * this installation cost must be added to the service total.
 */
export function getOrderPendingInstallationCost(order: OrderLike): number {
  if (!order) return 0;

  let directInstallCost = 0;
  if (order.installationCostCRC && order.installationCostCRC > 0) {
    directInstallCost = order.installationCostCRC;
  } else if (order.laborSubtotalCRC && order.laborSubtotalCRC > 0) {
    directInstallCost = order.laborSubtotalCRC;
  }

  let itemsInstallSum = 0;
  if (order.itemsJson) {
    try {
      const items = JSON.parse(order.itemsJson);
      if (Array.isArray(items) && items.length > 0) {
        let sum = 0;
        items.forEach((item: any) => {
          const isFree = Boolean(
            item.freeInstallation === true ||
            (item.withInstallation && item.installationPriceCRC === 0)
          );
          if (isFree) return;

          const price = Number(item.installationPriceCRC) || 0;
          const qty = Number(item.quantity) || 1;

          if (price > 0) {
            sum += price * qty;
          }
        });

        itemsInstallSum = sum;
      }
    } catch (e) {
      console.error("Error parsing itemsJson in getOrderPendingInstallationCost:", e);
    }
  }

  return Math.max(directInstallCost, itemsInstallSum);
}

/**
 * Returns whether a service type charges installation upfront during service booking.
 * - 'installation' (home installation): charges transport fee + installation upfront at booking.
 * - 'shop_installation' (only installation): client reserves a date WITHOUT paying upfront.
 *   Installation is paid during the 'INSTALLATION_PAYMENT' state.
 * - 'pickup': client only pays trailer transport upfront; installation is paid later on vehicle retrieval.
 * - 'delivery': transport only.
 */
export function isInstallationService(serviceType: string): boolean {
  return serviceType === "installation";
}

/**
 * Computes total pending installation cost for a collection of orders if the service type requires it.
 */
export function getTotalOrdersInstallationCost(orders: OrderLike[], serviceType: string): number {
  if (!isInstallationService(serviceType) || !Array.isArray(orders) || orders.length === 0) {
    return 0;
  }
  return orders.reduce((total, ord) => total + getOrderPendingInstallationCost(ord), 0);
}

/**
 * Computes total pending installation cost of orders regardless of service type.
 * Useful to check if orders have pending installation fees (e.g. for informative pickup notices).
 */
export function getOrdersPendingInstallationTotal(orders: OrderLike[]): number {
  if (!Array.isArray(orders) || orders.length === 0) {
    return 0;
  }
  return orders.reduce((total, ord) => total + getOrderPendingInstallationCost(ord), 0);
}
