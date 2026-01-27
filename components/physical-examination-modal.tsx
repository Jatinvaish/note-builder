"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PhysicalExamSection {
    enabled: boolean
    findings: string[]
}

export interface PhysicalExamConfig {
    pulmonary: PhysicalExamSection
    cardiovascular: PhysicalExamSection
    neurological: PhysicalExamSection
    abdominal: PhysicalExamSection
    musculoskeletal: PhysicalExamSection
    skin: PhysicalExamSection
    lymphatic: PhysicalExamSection
    genitourinary: PhysicalExamSection
    psychiatric: PhysicalExamSection
    headAndNeck: PhysicalExamSection
    eyes: PhysicalExamSection
    earsNoseThroat: PhysicalExamSection
    vitalSigns: PhysicalExamSection
}

interface PhysicalExamData {
    [key: string]: {
        [finding: string]: "normal" | "abnormal"
    }
}

interface PhysicalExaminationModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (mappedResults: Record<string, string>, unmappedResults: string[]) => void
    config?: PhysicalExamConfig | null
    userId?: number // kept for interface consistency, though currently using static config in parent for shadcn demo
}

export function PhysicalExaminationModal({
    isOpen,
    onClose,
    onSave,
    config: providedConfig,
}: PhysicalExaminationModalProps) {
    const [physicalExamData, setPhysicalExamData] = useState<PhysicalExamData>({})

    // Use provided config or fallback to default (handling the mock data structure from parent)
    // In the original file, config was set in state on click. We'll rely on parent passing it.

    const getActivePhysicalExams = () => {
        if (!providedConfig) return []
        const examLabels: Record<string, string> = {
            pulmonary: "Pulmonary",
            cardiovascular: "Cardiovascular",
            neurological: "Neurological",
            abdominal: "Abdominal",
            musculoskeletal: "Musculoskeletal",
            skin: "Skin",
            lymphatic: "Lymphatic",
            genitourinary: "Genitourinary",
            psychiatric: "Psychiatric",
            headAndNeck: "Head and Neck",
            eyes: "Eyes",
            earsNoseThroat: "Ears, Nose, and Throat",
            vitalSigns: "Vital Signs",
        }
        return Object.entries(providedConfig)
            .filter(([_, data]) => data.enabled)
            .map(([key, data]) => ({
                id: key,
                label: examLabels[key] || key,
                findings: data.findings,
            }))
    }

    const handleSave = () => {
        const examLabels: Record<string, string> = {
            pulmonary: "Pulmonary",
            cardiovascular: "Cardiovascular",
            neurological: "Neurological",
            abdominal: "Abdominal",
            musculoskeletal: "Musculoskeletal",
            skin: "Skin",
            lymphatic: "Lymphatic",
            genitourinary: "Genitourinary",
            psychiatric: "Psychiatric",
            headAndNeck: "Head and Neck",
            eyes: "Eyes",
            earsNoseThroat: "Ears, Nose, and Throat",
            vitalSigns: "Vital Signs",
        }

        const mappedResults: Record<string, string> = {};
        const unmappedResults: string[] = [];

        Object.entries(physicalExamData).forEach(([sectionId, data]) => {
            const sectionLabel = examLabels[sectionId] || sectionId;
            const sectionFindings: string[] = [];

            Object.entries(data).forEach(([finding, status]) => {
                sectionFindings.push(`${finding} (${status})`);
            });

            if (sectionFindings.length > 0) {
                const summary = sectionFindings.join(', ');
                mappedResults[sectionLabel] = summary;
            }
        });

        onSave(mappedResults, unmappedResults);

        setPhysicalExamData({});
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-teal-700">Physical Examination</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 pb-4">
                        {providedConfig && getActivePhysicalExams().length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm font-bold text-gray-700 mb-3">Select Findings</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {getActivePhysicalExams().map((section) => (
                                            <div
                                                key={section.id}
                                                className="bg-white p-3 rounded-md border border-gray-200"
                                            >
                                                <p className="font-semibold text-xs text-teal-600 mb-2">
                                                    {section.label}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {section.findings.map((finding: string) => {
                                                        const status = physicalExamData[section.id]?.[finding]
                                                        let bgColor = "bg-white"
                                                        if (status === "normal") bgColor = "bg-green-50"
                                                        else if (status === "abnormal") bgColor = "bg-red-50"
                                                        return (
                                                            <Button
                                                                key={finding}
                                                                size="sm"
                                                                variant="outline"
                                                                className={`text-xs px-2 min-w-[50px] h-7 ${bgColor} ${status === "normal" ? "border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800" :
                                                                    status === "abnormal" ? "border-red-500 text-red-700 hover:bg-red-100 hover:text-red-800" :
                                                                        "border-gray-200 text-gray-700 hover:bg-gray-50"
                                                                    }`}
                                                                onClick={() => {
                                                                    let newStatus: "normal" | "abnormal" | undefined
                                                                    if (!status) newStatus = "normal"
                                                                    else if (status === "normal") newStatus = "abnormal"
                                                                    else newStatus = undefined
                                                                    setPhysicalExamData((prev:any) => ({
                                                                        ...prev,
                                                                        [section.id]: {
                                                                            ...prev[section.id],
                                                                            ...(newStatus ? { [finding]: newStatus } :
                                                                                (() => {
                                                                                    const newSec:any = { ...prev[section.id] } || {}
                                                                                    delete newSec[finding]
                                                                                    return newSec
                                                                                })()
                                                                            ),
                                                                        },
                                                                    }))
                                                                }}
                                                            >
                                                                {finding}
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            onClose()
                            setPhysicalExamData({})
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                        Apply Findings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
