import { lazy, Suspense, type CSSProperties } from 'react';

// react-international-phone ships a full country/dial-code table, which is
// unnecessary weight for every visitor on every page. Load it only when this
// field actually mounts (i.e. only on pages that render the contact form),
// instead of a static top-level import that bundlers can pull into a shared
// eager chunk.
const PhoneInputLazy = lazy(async () => {
  await import('react-international-phone/style.css');
  const { PhoneInput } = await import('react-international-phone');
  return { default: PhoneInput };
});

// Theme react-international-phone to match the existing Input component
// (touch-input / rounded-2xl / primary-bg / border-border) via its
// documented CSS custom properties, so the dark theme stays in one place
// (src/styles/index.css) instead of fighting the library's own stylesheet.
const phoneInputStyle: CSSProperties & Record<string, string> = {
  '--react-international-phone-background-color': 'var(--color-primary-bg)',
  '--react-international-phone-text-color': 'var(--color-white)',
  '--react-international-phone-border-color': 'var(--color-border)',
  '--react-international-phone-border-radius': '1rem',
  '--react-international-phone-height': 'var(--touch-min)',
  '--react-international-phone-font-size': '0.875rem',
  '--react-international-phone-country-selector-background-color':
    'var(--color-primary-bg)',
  '--react-international-phone-country-selector-background-color-hover':
    'var(--color-border)',
  '--react-international-phone-country-selector-border-color':
    'var(--color-border)',
  '--react-international-phone-dropdown-item-background-color':
    'var(--color-primary-bg)',
  '--react-international-phone-dropdown-item-text-color': 'var(--color-white)',
  '--react-international-phone-dropdown-item-dial-code-color':
    'var(--color-muted)',
  '--react-international-phone-selected-dropdown-item-background-color':
    'var(--color-border)',
  '--react-international-phone-selected-dropdown-item-text-color':
    'var(--color-gold)',
};

interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// Same footprint as the fallback Input component (label + touch-min field)
// so the Suspense fallback never causes layout shift when the real widget
// takes over.
function PhoneFieldFallback() {
  return (
    <div
      className="w-full rounded-2xl border border-border bg-primary-bg/60"
      style={{ height: 'var(--touch-min)' }}
      aria-hidden
    />
  );
}

export default function PhoneField({ label, value, onChange }: PhoneFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor="contact-phone" className="text-sm font-medium text-muted">
        {label}
      </label>
      <Suspense fallback={<PhoneFieldFallback />}>
        <PhoneInputLazy
          defaultCountry="jp"
          preferredCountries={['jp', 'id']}
          value={value}
          onChange={(phone, meta) => {
            // The library reports the bare "+<dialCode>" as a non-empty
            // value the moment a country is selected, even if the user
            // never typed a subscriber number. Treat that case as "no
            // phone entered" so it isn't submitted as if it were real.
            const dialCodeOnly = phone === `+${meta.country.dialCode}`;
            onChange(dialCodeOnly ? '' : phone);
          }}
          inputProps={{ id: 'contact-phone', name: 'phone' }}
          style={phoneInputStyle}
          className="w-full max-w-full"
          inputClassName="!w-full focus:!border-youtube-red focus:!outline-none focus:!ring-1 focus:!ring-youtube-red"
          countrySelectorStyleProps={{
            buttonClassName: '!border-r-0',
            dropdownStyleProps: {
              // The library's dropdown list has a fixed 300px width, which
              // can overflow very narrow (~320px) viewports depending on
              // where the field sits in the page. Cap it to the viewport
              // instead of a fixed pixel value.
              style: { maxWidth: 'calc(100vw - 3rem)' },
            },
          }}
        />
      </Suspense>
    </div>
  );
}
