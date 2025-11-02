import React from 'react';

const FilterPanel = ({ fields = [], values = {}, onChange = () => {}, onApply = () => {}, className = '' }) => {
  return (
    <form className={`filters horizontal-filters ${className}`} onSubmit={(e) => { e.preventDefault(); onApply(); }}>
      <div className="filter-row">
        {fields.map(field => (
          <div className="filter-group" key={field.name} style={field.style || {}}>
            {field.type === 'select' ? (
              <select name={field.name} value={values[field.name] || ''} onChange={(e) => onChange(field.name, e.target.value)}>
                {(field.options || []).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                name={field.name}
                placeholder={field.placeholder || ''}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
          <button type="submit" className="btn">Apply Filters</button>
        </div>
      </div>
    </form>
  );
};

export default FilterPanel;
