
import { useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { type ApiConfig, type Variant, type ComparisonData, type NormalizationResult, type ConsolidatedDocs } from '../types';

export const useAgent = (
    apiConfig: ApiConfig,
    extractSpecs: (variant: Variant) => Promise<void>,
    runComparisonAndNormalization: () => Promise<void>,
    consolidateSpecs: () => Promise<void>,
    generateDiagramsAndBlueprint: () => Promise<void>,
    runValidation: () => Promise<void>,
    setError: (error: string | null) => void,
    setLoading: (loading: boolean, message?: string) => void
) => {
    const { state, dispatch } = useWorkspace();
    const { 
        currentWorkspace, 
        agentStatus, 
        loading,
        comparisonData, 
        normalizationResult,
        consolidatedDocs 
    } = state;

    useEffect(() => {
        if (agentStatus === 'idle' || agentStatus === 'complete' || agentStatus === 'error') {
            if (loading) setLoading(false);
            return;
        }

        const runNextTask = async () => {
            setError(null);
            try {
                if (agentStatus === 'analyzing') {
                    if (!currentWorkspace) throw new Error("Workspace not found.");
                    const nextVariant = currentWorkspace.variants.find(v => v.extractionProgress < v.totalExtractionSteps);
                    
                    if (nextVariant) {
                        dispatch({ type: 'ADD_AGENT_LOG', payload: `Analyzing variant: ${nextVariant.name}: Pass ${nextVariant.extractionProgress + 1}/${nextVariant.totalExtractionSteps}`});
                        await extractSpecs(nextVariant);
                        dispatch({ type: 'ADD_AGENT_LOG', payload: `Analysis for ${nextVariant.name} complete.`});
                    } else {
                        dispatch({ type: 'ADD_AGENT_LOG', payload: "All variants analyzed successfully."});
                        dispatch({ type: 'SET_AGENT_STATUS', payload: 'comparing_normalizing' });
                    }
                } else if (agentStatus === 'comparing_normalizing') {
                    if (!currentWorkspace || !currentWorkspace.variants.every(v => v.extractionProgress === v.totalExtractionSteps)) {
                        throw new Error('Assertion failed: Not all variants analyzed before comparison.');
                    }
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Comparing variants and normalizing models..."});
                    await runComparisonAndNormalization();
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Comparison and normalization complete."});
                    dispatch({ type: 'SET_AGENT_STATUS', payload: 'consolidating' });
                } else if (agentStatus === 'consolidating') {
                    if (!comparisonData || !normalizationResult) {
                        throw new Error('Assertion failed: No comparison/normalization data for consolidation.');
                    }
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Consolidating specifications..."});
                    await consolidateSpecs();
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Consolidation complete."});
                    dispatch({ type: 'SET_AGENT_STATUS', payload: 'generating_visuals' });
                } else if (agentStatus === 'generating_visuals') {
                    if (!consolidatedDocs) {
                        throw new Error('Assertion failed: No consolidated docs for visuals generation.');
                    }
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Generating diagrams and code blueprint..."});
                    await generateDiagramsAndBlueprint();
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Visuals and blueprint generation complete."});
                    dispatch({ type: 'SET_AGENT_STATUS', payload: 'validating' });
                } else if (agentStatus === 'validating') {
                    if (!consolidatedDocs) {
                        throw new Error('Assertion failed: No consolidated docs for validation.');
                    }
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Running round-trip validation..."});
                    await runValidation();
                    dispatch({ type: 'ADD_AGENT_LOG', payload: "Validation complete. Workflow finished."});
                    dispatch({ type: 'SET_AGENT_STATUS', payload: 'complete' });
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                setError(errorMessage);
                dispatch({ type: 'ADD_AGENT_LOG', payload: `ERROR: ${errorMessage}`});
                dispatch({ type: 'SET_AGENT_STATUS', payload: 'error' });
            }
        };

        runNextTask();
    }, [agentStatus, currentWorkspace]);

    return { agentStatus };
};
