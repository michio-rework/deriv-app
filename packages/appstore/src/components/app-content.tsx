import React from 'react';
import { routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import Routes from 'Components/routes/routes';
import classNames from 'classnames';
import './app.scss';
import { useAuth } from '@deriv/api';

const AppContent: React.FC = observer(() => {
    const { ui } = useStore();
    const { is_dark_mode_on } = ui;

    const { activeToken } = useAuth();

    console.log('akbar: ', activeToken);

    return (
        <main
            className={classNames('dashboard', {
                'theme--light': !is_dark_mode_on,
                'theme--dark': is_dark_mode_on,
                'dashboard-onboarding': window.location.pathname === routes.onboarding,
            })}
        >
            <div className='dw-dashboard'>
                <Routes />
            </div>
        </main>
    );
});

export default AppContent;
