interface PriceTrendPayload {
  domain: string
  productId: string
  days: number
}

interface PriceTrendItem {
  value: number
  date: number
}

interface PriceTrend {
  productId: string
  domain: string
  currencyCode: string
  priceStatus: 'NO_DATA' | 'OK'
  image?: string
  days: number
  priceTrend: PriceTrendItem[]
}

interface Coupon {
  name: string
  endDate: string
  directUrl: string
  code: string
}

interface Deal {
  name: string
  endDate: string
  directUrl: string
  title: string
}

export interface Ecommerce {
  isPolicyAgreed(): Promise<boolean>,
  setPolicyStatus(status: boolean): Promise<void>,
  onProductPageView(callback: Function): void,
  setIp(ip: string): Promise<void>

  getPriceTrend?({ domain, productId, days }: PriceTrendPayload): Promise<PriceTrend>
  getSavedCoupons?(url: string): Promise<Coupon[]>
  getSavedDeals?(url: string): Promise<Deal[]>
  onCouponFound?(callback: Function): void

  permissionsEnabled(): Promise<boolean>
  setPermissionsBadge(): Promise<void>
  removePermissionsBadge(): Promise<void>
  init?(): Promise<void>
}

export interface EcommerceConfig {
  requestPermissions: () => Promise<boolean>
  permissionsEnabled: () => Promise<boolean>
  removePermissionsBadge: () => Promise<void>
  setPermissionsBadge: () => Promise<void>
}
