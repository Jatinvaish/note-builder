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

    // Download PDF for a note (returns base64)
    async downloadPdf(noteId: number) {
        return await fetcher({ path: "/api/custom-notes/download-pdf" }, { json: { noteId } })
    },

    // Upload documents for a note
    async uploadDocuments(noteId: number, files: File[], patientId?: number | null, comment?: string) {
        const formData = new FormData()
        formData.append("data", JSON.stringify({
            noteId,
            patientId: patientId || null,
            comment: comment || null,
        }))
        files.forEach(f => formData.append("files", f))
        return await fetcher({ path: "/api/custom-notes/upload-documents" }, { body: formData })
    },

    // Get documents for a note
    async getDocuments(noteId: number) {
        return await fetcher({ path: "/api/custom-notes/get-documents" }, { json: { noteId } })
    },

    // Delete a document
    async deleteDocument(documentId: number) {
        return await fetcher({ path: "/api/custom-notes/delete-document" }, { json: { documentId } })
    },

    // Get admission info (patient details)
    async getAdmissionInfo(admissionId: number) {
        return await fetcher({ path: "/user/admission-info" }, { json: { admissionId } })
    },

    // List notes by admission (using id parameter)
    async listByAdmissionId(id: number): Promise<ConsultationNoteListItem[]> {
        return await fetcher({ path: "/api/custom-notes/list-by-admission" }, { json: { id } })
    },
}
