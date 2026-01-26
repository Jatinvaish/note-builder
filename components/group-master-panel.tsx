"use client"

import React from "react"

import { useState } from "react"
import type { Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Trash2, Edit2, Plus } from "lucide-react"

interface GroupMasterPanelProps {
  groups: Group[]
  onGroupCreate: (group: Omit<Group, "id">) => void
  onGroupUpdate: (group: Group) => void
  onGroupDelete: (groupId: string) => void
  onGroupReorder?: (groups: Group[]) => void
}

export function GroupMasterPanel({
  groups,
  onGroupCreate,
  onGroupUpdate,
  onGroupDelete,
  onGroupReorder,
}: GroupMasterPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState<{ group_name: string; status: "active" | "inactive"; order_by: number }>({
    group_name: "",
    status: "active",
    order_by: 0
  })
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)

  const sortedGroups = [...groups].sort((a, b) => a.order_by - b.order_by)

  const openDialog = (group?: Group) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        group_name: group.group_name,
        status: group.status,
        order_by: group.order_by,
      })
    } else {
      setEditingGroup(null)
      setFormData({ group_name: "", status: "active", order_by: groups.length })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingGroup(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.group_name.trim()) {
      alert("Group name is required")
      return
    }

    if (editingGroup) {
      onGroupUpdate({
        ...editingGroup,
        ...formData,
      })
    } else {
      onGroupCreate({
        group_name: formData.group_name.trim(),
        status: formData.status,
        order_by: formData.order_by,
      })
    }

    closeDialog()
  }

  const handleDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId)
    e.dataTransfer.setData("text/plain", groupId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    if (!draggedGroupId) return

    const updatedGroups = [...groups]
    const draggedIndex = updatedGroups.findIndex((group) => group.id === draggedGroupId)
    const targetIndex = updatedGroups.findIndex((group) => group.id === targetGroupId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedGroup] = updatedGroups.splice(draggedIndex, 1)
      updatedGroups.splice(targetIndex, 0, draggedGroup)

      if (onGroupReorder) {
        onGroupReorder(updatedGroups)
      }
    }

    setDraggedGroupId(null)
  }

  return (
    <div className="flex flex-col h-full bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">Group Master</h3>
        <Button size="sm" onClick={() => openDialog()} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No groups yet</p>
            <p className="text-xs text-muted-foreground mt-1">Groups are optional</p>
          </div>
        ) : (
          sortedGroups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-2 p-3 border border-border rounded-md bg-background hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{group.group_name}</p>
                  <p className="text-xs text-muted-foreground">Order #{group.order_by}</p>
                </div>
                <Badge variant={group.status === "active" ? "default" : "outline"} className="text-xs flex-shrink-0">
                  {group.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openDialog(group)}
                  className="h-6 w-6 p-0 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete group "${group.group_name}"?`)) {
                      onGroupDelete(group.id)
                    }
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Create New Group"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name *</label>
              <Input
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="e.g., Vital Signs, Examination"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                value={formData.order_by}
                onChange={(e) => setFormData({ ...formData, order_by: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingGroup ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
