import { beforeAll, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import Grid1 from './grid1';
import { setupTestMocks } from '../../setupTests';

beforeAll(() => {
  setupTestMocks();
})

test('renders Grid1 component', () => {
  const wrapper = render(<Grid1 />);
  expect(wrapper).toBeTruthy();
});
