import type { Group } from "./types"

let currentAvailableGroups: Group[] = []

export function setAvailableGroups(groups: Group[]) {
  currentAvailableGroups = groups
}

export function getAvailableGroups(): Group[] {
  return currentAvailableGroups
}
