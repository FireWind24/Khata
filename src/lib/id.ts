const DEVICE_KEY = 'khata.device_id'

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (id) return id
  id = uuid()
  localStorage.setItem(DEVICE_KEY, id)
  return id
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}