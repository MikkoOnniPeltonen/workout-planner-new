import { FilterChip } from '@/components/ui/filter-chip';

interface MuscleGroupFilterProps {
  groups: string[];
  value: string | null;
  onChange: (group: string | null) => void;
}

export function MuscleGroupFilter({ groups, value, onChange }: MuscleGroupFilterProps) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Filter by muscle group</legend>
      <FilterChip active={value === null} onClick={() => onChange(null)}>
        All
      </FilterChip>
      {groups.map((group) => (
        <FilterChip
          key={group}
          active={value === group}
          onClick={() => onChange(value === group ? null : group)}
        >
          {group}
        </FilterChip>
      ))}
    </fieldset>
  );
}
