import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-white">
              <span>🚌</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                BusBook Pakistan
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">
              Pakistan's premium online bus ticket booking platform. Search bus schedules, select your favorite seats, and make instant secure payments for a hassle-free journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Top Routes</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/?from=Karachi&to=Lahore" className="hover:text-white transition-premium">
                  Karachi &rarr; Lahore
                </Link>
              </li>
              <li>
                <Link to="/?from=Lahore&to=Islamabad" className="hover:text-white transition-premium">
                  Lahore &rarr; Islamabad
                </Link>
              </li>
              <li>
                <Link to="/?from=Islamabad&to=Peshawar" className="hover:text-white transition-premium">
                  Islamabad &rarr; Peshawar
                </Link>
              </li>
              <li>
                <Link to="/?from=Multan&to=Faisalabad" className="hover:text-white transition-premium">
                  Multan &rarr; Faisalabad
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-400 font-sans">
              <li className="flex flex-col">
                <span className="text-xs text-gray-500">Helpline:</span>
                <a href="tel:+923001234567" className="hover:text-white transition-premium font-medium">
                  +92 (300) 123-4567
                </a>
              </li>
              <li className="flex flex-col">
                <span className="text-xs text-gray-500">Email:</span>
                <a href="mailto:support@busbook.pk" className="hover:text-white transition-premium">
                  support@busbook.pk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; {currentYear} BusBook Pakistan. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-white cursor-pointer transition-premium">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-premium">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-premium">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
