import type { ReactNode } from "react"

export type NavItem = {
  title: string
  icon?: React.ElementType
  badge?: ReactNode
  isActive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export type NavGroup = {
  title: string
  items: NavItem[]
}
