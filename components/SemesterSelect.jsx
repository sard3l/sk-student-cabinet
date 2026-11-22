'use client';

import { useRouter } from 'next/navigation';

export default function SemesterSelect({ semesters, current }) {
  const router = useRouter();

  return (
    <div className="field__select" style={{ width: 252 }}>
      <select
        className="field__input"
        value={current}
        onChange={(e) => router.push('/gradebook?semester=' + encodeURIComponent(e.target.value))}
      >
        {semesters.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span className="field__chevron" aria-hidden="true">
        ⌄
      </span>
    </div>
  );
}
