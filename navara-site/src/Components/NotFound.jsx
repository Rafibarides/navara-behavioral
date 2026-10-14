import { Link } from 'react-router-dom';
export default function NotFound() {
  return <main style={{padding:'100px 24px',textAlign:'center',fontFamily:'Montserrat, sans-serif',color:'#1B3B62'}}><h1>Page not found</h1><p>The page you requested is not available.</p><Link to="/">Return to Navara's homepage</Link></main>;
}
