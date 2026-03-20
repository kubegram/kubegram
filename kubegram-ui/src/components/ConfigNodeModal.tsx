import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { type ConfigData } from '@/types/canvas';

interface ConfigNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    initialData?: ConfigData;
    onSave: (nodeId: string, data: ConfigData) => void;
}

export const ConfigNodeModal: React.FC<ConfigNodeModalProps> = ({
    isOpen,
    onClose,
    nodeId,
    initialData = {},
    onSave,
}) => {
    const [configEntries, setConfigEntries] = useState<[string, string][]>([]);

    useEffect(() => {
        if (isOpen) {
            setConfigEntries(Object.entries(initialData));
        }
    }, [isOpen, initialData]);

    const handleAddEntry = () => {
        setConfigEntries([...configEntries, ['', '']]);
    };

    const handleRemoveEntry = (index: number) => {
        const newEntries = [...configEntries];
        newEntries.splice(index, 1);
        setConfigEntries(newEntries);
    };

    const handleChange = (index: number, field: 'key' | 'value', value: string) => {
        const newEntries = [...configEntries];
        newEntries[index] = field === 'key'
            ? [value, newEntries[index][1]]
            : [newEntries[index][0], value];
        setConfigEntries(newEntries);
    };

    const handleSave = () => {
        const data: ConfigData = {};
        configEntries.forEach(([key, value]) => {
            if (key.trim()) {
                data[key.trim()] = value;
            }
        });
        onSave(nodeId, data);
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
                        <h2 className="text-xl font-bold text-white">Configuration</h2>
                        <p className="text-sm text-gray-400">Edit key-value pairs for this node</p>
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

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#1e1e1e]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-[1fr,1fr,40px] gap-4 mb-2 px-2">
                            <span className="text-sm font-medium text-gray-400">Key</span>
                            <span className="text-sm font-medium text-gray-400">Value</span>
                            <span className="w-8"></span>
                        </div>

                        {configEntries.map(([key, value], index) => (
                            <div key={index} className="grid grid-cols-[1fr,1fr,40px] gap-4 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                <Input
                                    placeholder="KEY"
                                    value={key}
                                    onChange={(e) => handleChange(index, 'key', e.target.value)}
                                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 font-mono text-sm"
                                />
                                <Input
                                    placeholder="Value"
                                    value={value}
                                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 font-mono text-sm"
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

                        {configEntries.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
                                <p className="text-gray-500">No configuration entries yet</p>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleAddEntry}
                            className="w-full border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Entry
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
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </Card>
        </div>
    );
};
