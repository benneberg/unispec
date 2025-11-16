
import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { type Workspace, type Variant, type ComparisonData, type ConsolidatedDocs, type NormalizationResult } from '../types';

type AgentStatus = 'idle' | 'analyzing' | 'comparing_normalizing' | 'consolidating' | 'generating_visuals' | 'validating' | 'complete' | 'error';

// Define state shape
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  agentStatus: AgentStatus;
  agentLog: string[];
  comparisonData: ComparisonData | null;
  normalizationResult: NormalizationResult | null;
  consolidatedDocs: ConsolidatedDocs | null;
  activeStep: number;
}

// Define actions
type Action =
  | { type: 'CREATE_WORKSPACE'; payload: string }
  | { type: 'UPDATE_WORKSPACE'; payload: Workspace }
  | { type: 'ADD_VARIANT'; payload: Omit<Variant, 'id' | 'extractedSpecs' | 'extractionProgress' | 'totalExtractionSteps'> }
  | { type: 'DELETE_VARIANT'; payload: string }
  | { type: 'UPDATE_VARIANT'; payload: Variant }
  | { type: 'SET_LOADING'; payload: { loading: boolean; message?: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_AGENT' }
  | { type: 'SET_AGENT_STATUS'; payload: AgentStatus }
  | { type: 'ADD_AGENT_LOG'; payload: string }
  | { type: 'SET_COMPARISON_DATA'; payload: ComparisonData | null }
  | { type: 'SET_NORMALIZATION_RESULT'; payload: NormalizationResult | null }
  | { type: 'SET_CONSOLIDATED_DOCS'; payload: ConsolidatedDocs | null }
  | { type: 'SET_ACTIVE_STEP'; payload: number };


const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  loadingMessage: 'Processing...',
  error: null,
  agentStatus: 'idle',
  agentLog: [],
  comparisonData: null,
  normalizationResult: null,
  consolidatedDocs: null,
  activeStep: 0,
};

function workspaceReducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'CREATE_WORKSPACE': {
      const newWorkspace: Workspace = {
        id: Date.now().toString(),
        name: action.payload,
        variants: [],
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        workspaces: [...state.workspaces, newWorkspace],
        currentWorkspace: newWorkspace,
        activeStep: 1,
      };
    }
    
    case 'UPDATE_WORKSPACE': {
      const updatedWorkspaces = state.workspaces.map(w => w.id === action.payload.id ? action.payload : w);
      return {
        ...state,
        workspaces: updatedWorkspaces,
        currentWorkspace: action.payload.id === state.currentWorkspace?.id ? action.payload : state.currentWorkspace,
      };
    }

    case 'ADD_VARIANT': {
        if (!state.currentWorkspace) return state;

        let totalExtractionSteps = 4;
        if (action.payload.sourceType === 'github') {
            try {
                const parsed = JSON.parse(action.payload.rawContent);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                    totalExtractionSteps = 5;
                }
            } catch(e) {/* Not a repo file map, defaults to 4 */}
        }
        const newVariant: Variant = {
            id: Date.now().toString(),
            ...action.payload,
            extractedSpecs: null,
            extractionProgress: 0,
            totalExtractionSteps,
        };
        const updatedWorkspace = {
            ...state.currentWorkspace,
            variants: [...state.currentWorkspace.variants, newVariant],
        };
        return workspaceReducer(state, { type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
    }

    case 'DELETE_VARIANT': {
        if (!state.currentWorkspace) return state;
        const updatedWorkspace = {
            ...state.currentWorkspace,
            variants: state.currentWorkspace.variants.filter(v => v.id !== action.payload),
        };
        return workspaceReducer(state, { type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
    }

    case 'UPDATE_VARIANT': {
      if (!state.currentWorkspace) return state;
      const updatedVariants = state.currentWorkspace.variants.map(v => v.id === action.payload.id ? action.payload : v);
      const updatedWorkspace = { ...state.currentWorkspace, variants: updatedVariants };
      return workspaceReducer(state, { type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
    }

    case 'SET_LOADING':
      return { ...state, loading: action.payload.loading, loadingMessage: action.payload.message || 'Processing...' };

    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'START_AGENT':
      return { ...state, agentLog: ['Agent started...'], agentStatus: 'analyzing', activeStep: 2 };

    case 'SET_AGENT_STATUS':
      let nextStep = state.activeStep;
      if (action.payload === 'comparing_normalizing') nextStep = 3;
      if (action.payload === 'complete') nextStep = 8;
      return { ...state, agentStatus: action.payload, activeStep: nextStep };
    
    case 'ADD_AGENT_LOG':
      return { ...state, agentLog: [...state.agentLog, action.payload] };
      
    case 'SET_COMPARISON_DATA':
        return { ...state, comparisonData: action.payload };

    case 'SET_NORMALIZATION_RESULT':
        return { ...state, normalizationResult: action.payload };

    case 'SET_CONSOLIDATED_DOCS': {
        const updatedWorkspace = state.currentWorkspace ? { ...state.currentWorkspace, consolidatedSpecs: action.payload } : null;
        const finalState = { ...state, consolidatedDocs: action.payload };
        if (updatedWorkspace) {
            return workspaceReducer(finalState, { type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });
        }
        return finalState;
    }
    
    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.payload };

    default:
      return state;
  }
}

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
} | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const value = { state, dispatch };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
