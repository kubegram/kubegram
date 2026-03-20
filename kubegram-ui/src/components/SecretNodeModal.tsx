import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileUp, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { SecretData } from '@/types/canvas';

interface SecretNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    initialData?: SecretData;
    onSave: (nodeId: string, data: SecretData) => void;
}

export const SecretNodeModal: React.FC<SecretNodeModalProps> = ({
    isOpen,
    onClose,
    nodeId,
    initialData = { data: {}, format: 'opaque' },
    onSave,
}) => {
    const [dataEntries, setDataEntries] = useState<[string, string][]>([]);
    const [format, setFormat] = useState<'opaque' | 'dockerconfigjson'>('opaque');
    const [showValues, setShowValues] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDataEntries(Object.entries(initialData.data));
            setFormat(initialData.format);
        }
    }, [isOpen, initialData]);

    const handleAddEntry = () => {
        setDataEntries([...dataEntries, ['', '']]);
    };

    const handleRemoveEntry = (index: number) => {
        const newEntries = [...dataEntries];
        newEntries.splice(index, 1);
        setDataEntries(newEntries);
    };

    const handleChange = (index: number, field: 'key' | 'value', value: string) => {
        const newEntries = [...dataEntries];
        newEntries[index] = field === 'key'
            ? [value, newEntries[index][1]]
            : [newEntries[index][0], value];
        setDataEntries(newEntries);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                // Basic implementation: add file name as key and content as value
                setDataEntries([...dataEntries, [file.name, content]]);
            };
            reader.readAsText(file);
        }
    };

    const handleSave = () => {
        const data: { [key: string]: string } = {};
        dataEntries.forEach(([key, value]) => {
            if (key.trim()) {
                data[key.trim()] = value;
            }
        });
        onSave(nodeId, { data, format });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card
                className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                style={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#252525]">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">Secret Management</h2>
                            <span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-xs border border-red-800/50">
                                Sensitive
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">Manage sensitive data and keys</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Controls */}
                <div className="px-6 py-4 bg-[#232323] border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as 'opaque' | 'dockerconfigjson')}
                            className="bg-[#2a2a2a] border border-gray-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-red-500"
                        >
                            <option value="opaque">Opaque (Generic)</option>
                            <option value="dockerconfigjson">Docker Config JSON</option>
                        </select>

                        <div className="relative">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                            >
                                <FileUp className="w-4 h-4" /> Import File
                            </label>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowValues(!showValues)}
                        className="text-gray-400 hover:text-white"
                    >
                        {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showValues ? 'Hide Values' : 'Show Values'}
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#1e1e1e]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-[1fr,1fr,40px] gap-4 mb-2 px-2">
                            <span className="text-sm font-medium text-gray-400">Key</span>
                            <span className="text-sm font-medium text-gray-400">Value</span>
                            <span className="w-8"></span>
                        </div>

                        {dataEntries.map(([key, value], index) => (
                            <div key={index} className="grid grid-cols-[1fr,1fr,40px] gap-4 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                <Input
                                    placeholder="KEY"
                                    value={key}
                                    onChange={(e) => handleChange(index, 'key', e.target.value)}
                                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:border-red-500 font-mono text-sm"
                                />
                                <Input
                                    type={showValues ? "text" : "password"}
                                    placeholder="Value"
                                    value={value}
                                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:border-red-500 font-mono text-sm"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveEntry(index)}
                                    className="h-9 w-9 text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        {dataEntries.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
                                <p className="text-gray-500">No secret entries yet</p>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleAddEntry}
                            className="w-full border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Secret
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-[#252525] flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Save className="w-4 h-4 mr-2" /> Save Secrets
                    </Button>
                </div>
            </Card>
        </div>
    );
};
