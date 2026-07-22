/**
 * Yemeksepeti (Delivery Hero) statülerini JetPos içi statülere eşler.
 *
 * Platform olayları (webhook):
 *   RECEIVED / ACCEPTED / PICKED / READY_FOR_PICKUP / DISPATCHED / DELIVERED / CANCELLED
 * JetPos içi:
 *   new / accepted / preparing / ready / on_way / delivered / cancelled
 */

export function mapYsStatus(ysStatus: string | undefined | null): string {
    const s = String(ysStatus || "").toUpperCase();
    switch (s) {
        case "RECEIVED":
        case "NEW":
        case "PENDING":
            return "new";
        case "ACCEPTED":
        case "CONFIRMED":
            return "accepted";
        case "PICKING":
        case "PREPARING":
        case "IN_PROGRESS":
            return "preparing";
        case "READY_FOR_PICKUP":
        case "PICKED":
        case "READY":
            return "ready";
        case "DISPATCHED":
        case "ON_THE_WAY":
        case "IN_DELIVERY":
            return "on_way";
        case "DELIVERED":
        case "COMPLETED":
        case "CLOSED":
            return "delivered";
        case "CANCELLED":
        case "REJECTED":
        case "FAILED":
            return "cancelled";
        default:
            return "new";
    }
}

/**
 * JetPos aksiyonunu → Partner API PUT status'üne çevir.
 * (Kabul akışı platformda ayrı olabilir; burada güncelleme endpoint'inin
 *  desteklediği dört statüye eşliyoruz.)
 */
export function actionToYsStatus(action: string): "CANCELLED" | "DISPATCHED" | "READY_FOR_PICKUP" | "UPDATE_CART" | null {
    switch (action) {
        case "ready":       return "READY_FOR_PICKUP";
        case "dispatch":
        case "on_way":      return "DISPATCHED";
        case "cancel":      return "CANCELLED";
        case "update_cart": return "UPDATE_CART";
        default:            return null;
    }
}
