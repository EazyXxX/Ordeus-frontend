export { cn } from "cn"

// Focusing a field on a touch screen opens the keyboard over what is being read.
export const hasTouchScreen = () => window.matchMedia('(pointer: coarse)').matches
