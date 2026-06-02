import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useApp } from '../../context/AppContext';

export default function HierarchyPage() {
  const { toast } = useApp();
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await usersApi.hierarchy();
      setHierarchy(r.data); // Assuming backend returns the root node(s) or an array
    } catch (e) {
      toast('Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Team Hierarchy</h2>
      
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : !hierarchy || (Array.isArray(hierarchy) && hierarchy.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)' }}>No hierarchy data</div>
        ) : (
          <div style={{ minWidth: 600 }}>
            {Array.isArray(hierarchy) 
              ? hierarchy.map((node, i) => <TreeNode key={i} node={node} />)
              : <TreeNode node={hierarchy} />
            }
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: level > 0 ? 24 : 0, position: 'relative' }}>
      {/* Connector lines for children */}
      {level > 0 && (
        <div style={{ 
          position: 'absolute', 
          left: -12, 
          top: 18, 
          width: 12, 
          height: 1, 
          background: 'var(--border)' 
        }} />
      )}
      {level > 0 && (
        <div style={{ 
          position: 'absolute', 
          left: -12, 
          top: -10, 
          width: 1, 
          height: 28, 
          background: 'var(--border)' 
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        {hasChildren ? (
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{ 
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', 
              border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 4, cursor: 'pointer',
              fontSize: 14, lineHeight: 1, padding: 0
            }}
          >
            {expanded ? '-' : '+'}
          </button>
        ) : (
          <div style={{ width: 20 }} /> /* Spacer */
        )}

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 12, 
          border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px',
          background: 'var(--bg)', minWidth: 200, boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold' }}>
            {node.name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{node.name}</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'capitalize' }}>{node.role}</div>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ borderLeft: '1px solid var(--border)', marginLeft: 9 }}>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
