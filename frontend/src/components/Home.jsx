import { Link } from 'react-router-dom';

export default function Home() {

  return (
    <div className="home-container">
        <div className="home-info">
            <div className="naming">
                <p>Hello, world!</p>
            </div>

            <nav className="header-nav-home">
                <ul className="header-menu-home">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/registration">Registration</Link></li>
                </ul>
            </nav>

            <div className='authors'>
                <p>Starring:</p>

                <div className="name">
                    <li>Alexsey Go Pro</li>
                    <li>Dmitro Sckrinik</li>
                    <li>Alexandro MGS</li>
                    <li>vlaDICK</li>
                    <li>Angel</li>
                </div>
            </div>
        </div>

    </div>
  );
}