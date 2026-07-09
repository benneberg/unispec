import React from 'react';
import { type Workspace } from '../types';
import { Check, Loader2, AlertTriangle } from './Icons';

type PipelineStatus = 'pending' | 'in-progress' | 'complete' | 'error';

interface PipelineNodeProps {
  title: string;
  status: PipelineStatus;
  description: string;
  index: number;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ title, status, description, index }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return {
          card: 'border-black bg-white text-black',
          badge: 'bg-black text-white',
          text: 'text-black',
          desc: 'text-neutral-500',
        };
      case 'in-progress':
        return {
          card: 'border-black bg-white text-black ring-2 ring-black/10 animate-pulse',
          badge: 'bg-[#FF5500] text-white',
          text: 'text-black',
          desc: 'text-[#FF5500] font-bold',
        };
      case 'error':
        return {
          card: 'border-red-600 bg-red-50 text-red-900',
          badge: 'bg-red-600 text-white',
          text: 'text-red-700',
          desc: 'text-red-600',
        };
      case 'pending':
      default:
        return {
          card: 'border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60',
          badge: 'bg-neutral-200 text-neutral-600',
          text: 'text-neutral-400',
          desc: 'text-neutral-400',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`p-4 border-2 rounded-none transition-all duration-300 ${styles.card}`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
            [0{index + 1}]
          </span>
          {status === 'complete' && <Check className="w-3.5 h-3.5 text-black" />}
          {status === 'in-progress' && <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />}
          {status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
            {title}
          </h4>
          <p className="text-[10px] font-mono mt-1 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};


interface PipelineViewProps {
  workspace: Workspace;
  agentStatus: 'idle' | 'analyzing' | 'comparing_normalizing' | 'consolidating' | 'generating_visuals' | 'validating' | 'complete' | 'error';
  error: boolean;
}

const PipelineView: React.FC<PipelineViewProps> = ({ workspace, agentStatus, error }) => {
    const { variants, consolidatedSpecs } = workspace;
    const isAnalysisDone = variants.length > 0 && variants.every(v => v.extractionProgress === v.totalExtractionSteps);

    const getStatus = (
        stage: 'input' | 'analyze' | 'compare' | 'consolidate' | 'visualize' | 'validate' | 'output'
    ): PipelineStatus => {
        if (error && (
            (stage === 'analyze' && agentStatus === 'analyzing') ||
            (stage === 'compare' && agentStatus === 'comparing_normalizing') ||
            (stage === 'consolidate' && agentStatus === 'consolidating') ||
            (stage === 'visualize' && agentStatus === 'generating_visuals') ||
            (stage === 'validate' && agentStatus === 'validating') ||
            agentStatus === 'error'
        )) {
            return 'error';
        }

        switch (stage) {
            case 'input':
                return variants.length > 0 ? 'complete' : 'pending';
            case 'analyze':
                if (isAnalysisDone) return 'complete';
                if (agentStatus === 'analyzing') return 'in-progress';
                return 'pending';
            case 'compare':
                if (workspace.consolidatedSpecs?.migration) return 'complete'; 
                if (consolidatedSpecs) return 'complete';
                if (agentStatus === 'comparing_normalizing') return 'in-progress';
                return 'pending';
            case 'consolidate':
                if (consolidatedSpecs?.architectureDiagrams) return 'complete';
                if (consolidatedSpecs) return 'complete';
                if (agentStatus === 'consolidating') return 'in-progress';
                return 'pending';
            case 'visualize':
                if (consolidatedSpecs?.validationReport) return 'complete';
                if (consolidatedSpecs?.architectureDiagrams) return 'complete';
                if (agentStatus === 'generating_visuals') return 'in-progress';
                return 'pending';
            case 'validate':
                if (agentStatus === 'complete') return 'complete';
                if (consolidatedSpecs?.validationReport) return 'complete';
                if (agentStatus === 'validating') return 'in-progress';
                return 'pending';
            case 'output':
                 if (agentStatus === 'complete') return 'complete';
                 return 'pending';
            default:
                return 'pending';
        }
    }

    return (
        <div className="bg-white border-2 border-black rounded-none p-6 md:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF5500] inline-block"></span>
                  Analysis Pipeline Flow
                </h3>
                <div className="border border-black px-2.5 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-black bg-neutral-50">
                  SYS_ENG.ORCHESTRATE = 1
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
               <PipelineNode index={0} title="Input" description={`${variants.length} Sources`} status={getStatus('input')} />
               <PipelineNode index={1} title="Decon" description="Extract Traits" status={getStatus('analyze')} />
               <PipelineNode index={2} title="Align" description="Synthesize" status={getStatus('compare')} />
               <PipelineNode index={3} title="Merge" description="Unify Context" status={getStatus('consolidate')} />
               <PipelineNode index={4} title="Graph" description="Architecture" status={getStatus('visualize')} />
               <PipelineNode index={5} title="Audit" description="Logic Check" status={getStatus('validate')} />
               <PipelineNode index={6} title="Ship" description="Ready Bundle" status={getStatus('output')} />
            </div>
        </div>
    );
};

export default PipelineView;
