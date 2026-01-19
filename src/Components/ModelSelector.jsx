import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Zap, DollarSign, Clock } from 'lucide-react';

const ModelSelector = ({ isOpen, onClose, toolType, currentModel, onSelectModel, pricing }) => {
    const toolPricing = pricing[toolType];

    if (!toolPricing) return null;

    const selectedModelData = toolPricing.models.find(m => m.id === currentModel);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-2xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-bold text-maintext capitalize">
                                        Select {toolType} Model
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                                    >
                                        <X className="w-5 h-5 text-subtext" />
                                    </button>
                                </div>

                                <p className="text-sm text-subtext mb-4">
                                    Choose which AI model to use for {toolType} processing. Chat is always free!
                                </p>

                                <div className="space-y-2">
                                    {toolPricing.models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => onSelectModel(model.id)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${currentModel === model.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50 hover:bg-surface'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-maintext">{model.name}</h3>
                                                    <p className="text-xs text-subtext mt-0.5">{model.description}</p>
                                                </div>
                                                {currentModel === model.id && (
                                                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1 text-subtext">
                                                    <DollarSign className="w-3 h-3" />
                                                    <span className="font-medium">
                                                        {model.price === 0 ? 'Free' : `$${model.price}/use`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-subtext">
                                                    <Zap className="w-3 h-3" />
                                                    <span>{model.speed}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="mt-4 w-full bg-primary text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Done
                                </button>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ModelSelector;
