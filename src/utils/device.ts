export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * Accurately determines if the device is a Desktop/Laptop, Tablet, or Mobile Phone.
 * Guarantees laptops (including touchscreen laptops) are classified as 'desktop'
 * so on-screen touch controls are never displayed on PC/laptops.
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent || '';

  // 1. Apple iPad / iPadOS detection
  // iPadOS 13+ reports userAgent as 'Macintosh; Intel Mac OS X...', but has maxTouchPoints > 1
  const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const isIPad = /iPad/i.test(ua) || isIPadOS;

  // 2. Android Tablet detection (Android without Mobile in user agent)
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
  const isOtherTablet = /Tablet|Silk/i.test(ua);

  if (isIPad || isAndroidTablet || isOtherTablet) {
    return 'tablet';
  }

  // 3. Mobile phone user agents
  const isMobileUA = /iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(ua);
  if (isMobileUA) {
    return 'mobile';
  }

  // 4. Pointer & Hover capabilities (Standard W3C media queries)
  // Laptop/Desktop PC (even with touchscreen like Surface or Yoga) has fine pointer & hover
  const isFinePointer = window.matchMedia?.('(pointer: fine) and (hover: hover)')?.matches;
  const isCoarseOnly = window.matchMedia?.('(pointer: coarse) and (hover: none)')?.matches;

  // 5. Coarse touch screen with no fine pointer:
  if (isCoarseOnly) {
    return window.innerWidth >= 768 ? 'tablet' : 'mobile';
  }

  // If fine pointer (mouse/trackpad) exists on a desktop operating system (Windows/Mac/Linux)
  // and userAgent does NOT match mobile/tablet, it is a Laptop or PC!
  if (isFinePointer) {
    return 'desktop';
  }

  // Fallback for smaller screens with touch
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  if (hasTouch) {
    return window.innerWidth < 768 ? 'mobile' : 'tablet';
  }

  return 'desktop';
}

/**
 * Returns true ONLY if device is an actual Mobile Phone or Tablet.
 * Returns false on laptops, PCs, and workstations.
 */
export function shouldShowOnScreenControls(): boolean {
  const type = getDeviceType();
  return type === 'mobile' || type === 'tablet';
}
