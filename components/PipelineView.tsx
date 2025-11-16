import React from 'react';
import { type Workspace } from '../types';
import { Box, Check, ChevronRight, FileCog, FileText, GitMerge, Loader2, Palette, ShieldCheck, Zap, AlertTriangle, Download } from './Icons';

type PipelineStatus = 'pending' | 'in-progress' | 'complete' | 'error';

interface PipelineNodeProps {
  title: string;
  status: PipelineStatus;
  icon: React.ReactNode;
  description: string;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ title, status, icon, description }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return {
          ring: 'ring-green-500',
          bg: 'bg-green-500/10',
          iconBg: 'bg-green-500',
          text: 'text-green-300',
        };
      case 'in-progress':
        return {
          ring: 'ring-purple-500 animate-pulse',
          bg: 'bg-purple-500/10',
          iconBg: 'bg-purple-500',
          text: 'text-purple-300',
        };
      case 'error':
         return {
          ring: 'ring-red-500',
          bg: 'bg-red-500/10',
          iconBg: 'bg-red-500',
          text: 'text-red-300',
        };
      case 'pending':
      default:
        return {
          ring: 'ring-slate-700',
          bg: 'bg-slate-900/50',
          iconBg: 'bg-slate-700',
          text: 'text-slate-400',
        };
    }
  };

  const styles = getStatusStyles();

  const StatusIcon = () => {
      switch (status) {
          case 'in-progress': return <Loader2 className="w-4 h-4 text-white animate-spin" />;
          case 'complete': return <Check className="w-4 h-4 text-white" />;
          case 'error': return <AlertTriangle className="w-4 h-4 text-white" />;
          default: return icon;
      }
  }

  return (
    <div className={`flex-1 min-w-[150px] p-4 rounded-lg border border-transparent ring-2 ${styles.ring} ${styles.bg} transition-all duration-300`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.iconBg} flex-shrink-0`}>
            <StatusIcon />
        </div>
        <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className={`text-xs ${styles.text}`}>{description}</p>
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
                if (workspace.consolidatedSpecs?.migration) return 'complete'; // A proxy for whole flow being done
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

    const Connector = () => <ChevronRight className="w-6 h-6 text-slate-600 hidden lg:block" />;

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-purple-500/20">
            <h3 className="text-xl font-bold mb-4">Workflow Pipeline</h3>
            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-2 sm:gap-4">
               <PipelineNode title="Input" description={`${variants.length} Variants`} status={getStatus('input')} icon={<FileText className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Analyze" description="Extract Specs" status={getStatus('analyze')} icon={<Zap className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Compare" description="Normalize Models" status={getStatus('compare')} icon={<GitMerge className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Consolidate" description="Generate Docs" status={getStatus('consolidate')} icon={<FileCog className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Visualize" description="Create Diagrams" status={getStatus('visualize')} icon={<Palette className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Validate" description="Check Fidelity" status={getStatus('validate')} icon={<ShieldCheck className="w-4 h-4 text-white" />} />
               <Connector />
               <PipelineNode title="Output" description="Export Results" status={getStatus('output')} icon={<Download className="w-4 h-4 text-white" />} />
            </div>
        </div>
    );
};

export default PipelineView;
