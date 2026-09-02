import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './App';

test('renders the login page heading', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});

test('explains that public accounts are created as learners', () => {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/created as learner accounts/i)).toBeInTheDocument();
});
