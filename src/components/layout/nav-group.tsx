"use client"

import { useCallback } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { NavGroup as NavGroupType, NavItem } from "@/components/layout/types"

export function NavGroup({ title, items }: NavGroupType) {
  const { setOpenMobile } = useSidebar()

  const handleSelect = useCallback(
    (item: NavItem) => {
      if (item.disabled) {
        return
      }

      item.onSelect?.()
      setOpenMobile(false)
    },
    [setOpenMobile]
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive}
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
              >
                {item.icon ? <item.icon /> : null}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
