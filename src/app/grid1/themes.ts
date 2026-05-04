import materialLight from 'igniteui-react-grids/grids/themes/light/material.css?url';
import materialDark from 'igniteui-react-grids/grids/themes/dark/material.css?url';
import bootstrapLight from 'igniteui-react-grids/grids/themes/light/bootstrap.css?url';
import bootstrapDark from 'igniteui-react-grids/grids/themes/dark/bootstrap.css?url';
import fluentLight from 'igniteui-react-grids/grids/themes/light/fluent.css?url';
import fluentDark from 'igniteui-react-grids/grids/themes/dark/fluent.css?url';
import indigoLight from 'igniteui-react-grids/grids/themes/light/indigo.css?url';
import indigoDark from 'igniteui-react-grids/grids/themes/dark/indigo.css?url';

export type ThemeId =
  | 'material-dark'
  | 'material-light'
  | 'indigo-dark'
  | 'indigo-light'
  | 'bootstrap-dark'
  | 'bootstrap-light'
  | 'fluent-dark'
  | 'fluent-light'
  | 'aurora-ops';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  variant: 'dark' | 'light';
  href: string;
  custom?: boolean;
}

export const THEMES: ThemeOption[] = [
  { id: 'material-dark', label: 'Material Dark', variant: 'dark', href: materialDark },
  { id: 'material-light', label: 'Material Light', variant: 'light', href: materialLight },
  { id: 'indigo-dark', label: 'Indigo Dark', variant: 'dark', href: indigoDark },
  { id: 'indigo-light', label: 'Indigo Light', variant: 'light', href: indigoLight },
  { id: 'bootstrap-dark', label: 'Bootstrap Dark', variant: 'dark', href: bootstrapDark },
  { id: 'bootstrap-light', label: 'Bootstrap Light', variant: 'light', href: bootstrapLight },
  { id: 'fluent-dark', label: 'Fluent Dark', variant: 'dark', href: fluentDark },
  { id: 'fluent-light', label: 'Fluent Light', variant: 'light', href: fluentLight },
  // Aurora Ops layers extra CSS overrides on top of the indigo dark base
  // theme (loaded from the same href). The auroraOps class on the page
  // wrapper drives the visual customization.
  { id: 'aurora-ops', label: 'Aurora Ops', variant: 'dark', href: indigoDark, custom: true },
];

export const DEFAULT_THEME_ID: ThemeId = 'material-dark';
