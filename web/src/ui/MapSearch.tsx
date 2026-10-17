import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchGeo } from './mapSearchLogic.js';
import type { SearchResult } from './mapSearchLogic.js';

export interface MapSearchProps {
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function MapSearch({
  onSelect,
  placeholder = 'Buscar provincia, departamento o proyecto...',
  className = ''
}: MapSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchGeo(query, 8);

  const handlePick = useCallback(
    (item: SearchResult) => {
      onSelect(item);
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= results.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) handlePick(target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`map-search-container ${className}`}
      style={{ position: 'relative', width: '100%', maxWidth: '320px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '4px 10px',
          transition: 'border-color 0.2s'
        }}
      >
        <span
          style={{
            color: 'var(--ink-muted)',
            fontSize: '0.85rem',
            marginRight: '6px',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-autocomplete="list"
          aria-controls="map-search-listbox"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `map-search-opt-${results[activeIndex]?.id}`
              : undefined
          }
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            fontSize: '0.85rem',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Borrar búsqueda"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '0.85rem'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="map-search-listbox"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            margin: 0,
            padding: '4px',
            listStyle: 'none',
            zIndex: 100,
            maxHeight: '260px',
            overflowY: 'auto'
          }}
        >
          {results.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <li
                key={item.id}
                id={`map-search-opt-${item.id}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handlePick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePick(item);
                  }
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'transparent',
                  color: 'var(--ink)',
                  transition: 'background 0.15s'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}
                >
                  <strong style={{ fontSize: '0.88rem' }}>{item.name}</strong>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background:
                        item.type === 'provincia'
                          ? 'rgba(56, 189, 248, 0.2)'
                          : item.type === 'proyecto'
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(148, 163, 184, 0.15)',
                      color:
                        item.type === 'provincia'
                          ? '#38bdf8'
                          : item.type === 'proyecto'
                            ? '#facc15'
                            : 'var(--ink-muted)'
                    }}
                  >
                    {item.type === 'provincia'
                      ? 'Provincia'
                      : item.type === 'proyecto'
                        ? 'Proyecto'
                        : 'Departamento'}
                  </span>
                </div>
                {item.subtitle && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ink-muted)'
                    }}
                  >
                    {item.subtitle}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
