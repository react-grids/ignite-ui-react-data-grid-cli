import { Navigate } from 'react-router-dom';
import Home from './home/home';
import Grid1 from './grid1/grid1';

export const routes = [
  { path: '/', element: <Grid1 />, text: 'grid1' },
  { path: 'home', element: <Home />, text: 'Home' },
  { path: '*', element: <Navigate to="/" replace /> }
];
