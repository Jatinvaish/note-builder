import { fetcher } from "@/lib/services/fetcher"

export interface ConsultationNoteApiData {
    id?: number | null
    templateId: number
    consultationType: string
    admissionId: number | null
    appointmentId: number | null
    noteContent: any
    formData: Record<string, any>
    status: string
}

export interface ConsultationNoteListItem {
    id: number
    templateId: number
    templateName: string
    consultationType: string
    admissionId?: number
    appointmentId?: number
    savedBy: string
    versionCount: number
    status: string
    createdAt: string
    updatedAt: string
}

export const consultationNoteApi = {
    // Save or update a session note
    async save(note: ConsultationNoteApiData) {
        const response = await fetcher({ path: "/api/custom-notes/save" }, { json: note })
        return response?.note || response
    },

    // List notes by admission ID
    async listByAdmission(admissionId: number): Promise<ConsultationNoteListItem[]> {
        return await fetcher({ path: "/api/custom-notes/list-by-admission" }, { json: { admissionId } })
    },

    // Get single note details by id
    async view(id: number) {
        return await fetcher({ path: "/api/custom-notes/view" }, { json: { id } })
    },

    // Get version history for a note
    async versionHistory(id: number) {
        return await fetcher({ path: "/api/custom-notes/version-history" }, { json: { id } })
    },

    // Restore note to a specific version (returns the version data)
    async restoreVersion(noteId: number, version: number) {
        const response = await fetcher({ path: "/api/custom-notes/restore-version" }, { json: { noteId, version } })
        return response?.version || response
    },
}
