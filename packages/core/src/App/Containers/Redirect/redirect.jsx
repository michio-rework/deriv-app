import React from 'react';
import { withRouter, useHistory } from 'react-router-dom';
import { loginUrl, routes, redirectToLogin, SessionStore, PlatformContext } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { getLanguage } from '@deriv/translations';
import { WS } from 'Services';
import { Analytics } from '@deriv/analytics';

const Redirect = observer(() => {
    const history = useHistory();
    const { client, ui } = useStore();

    const { currency, is_logged_in, is_logging_in, setNewEmail, setVerificationCode, verification_code } = client;

    const {
        openRealAccountSignup,
        setResetTradingPasswordModalOpen,
        toggleAccountSignupModal,
        toggleResetPasswordModal,
        toggleResetEmailModal,
        toggleUpdateEmailModal,
        is_mobile,
    } = ui;

    const url_query_string = window.location.search;
    const url_params = new URLSearchParams(url_query_string);
    let redirected_to_route = false;
    const action_param = url_params.get('action');
    const code_param = url_params.get('code') || verification_code[action_param];
    const ext_platform_url = url_params.get('ext_platform_url');
    const is_next_wallet = localStorage.getObject('FeatureFlagsStore')?.data?.next_wallet;
    const { is_appstore } = React.useContext(PlatformContext);

    const redirectToExternalPlatform = url => {
        history.push(`${routes.root}?ext_platform_url=${url}`);
        redirected_to_route = true;
    };
    setVerificationCode(code_param, action_param);
    setNewEmail(url_params.get('email'), action_param);

    switch (action_param) {
        case 'signup': {
            if (!is_appstore) {
                Analytics.trackEvent('ce_virtual_signup_form', {
                    action: 'email_confirmed',
                    form_name: is_mobile ? 'virtual_signup_web_mobile_default' : 'virtual_signup_web_desktop_default',
                    email: url_params.get('email'),
                });
            }
            SessionStore.set('signup_query_param', url_query_string);
            history.push({
                pathname: routes.onboarding,
                search: url_query_string,
            });
            SessionStore.remove('redirect_url');
            redirected_to_route = true;
            toggleAccountSignupModal(true);
            break;
        }
        case 'reset_password': {
            toggleResetPasswordModal(true);
            break;
        }
        case 'request_email': {
            toggleResetEmailModal(true);
            break;
        }
        case 'social_email_change': {
            toggleResetPasswordModal(true);
            break;
        }
        case 'system_email_change': {
            toggleUpdateEmailModal(true);
            break;
        }
        case 'trading_platform_mt5_password_reset':
        case 'trading_platform_dxtrade_password_reset': {
            const reset_code_key = `${action_param}_code`;
            if (!is_logging_in && !is_logged_in) {
                if (verification_code[action_param]) {
                    sessionStorage.setItem(reset_code_key, verification_code[action_param]);
                }
                redirectToLogin(is_logged_in, getLanguage());
                redirected_to_route = true;
                break;
            }
            if (!verification_code[action_param]) {
                const reset_code = sessionStorage.getItem(reset_code_key);
                setVerificationCode(reset_code, action_param);
                sessionStorage.removeItem(reset_code_key);
            }
            const redirect_to = url_params.get('redirect_to');

            if (redirect_to) {
                let pathname = '';
                let hash = '';
                switch (redirect_to) {
                    case '1':
                        pathname = routes.traders_hub;
                        break;
                    case '10':
                        pathname = routes.traders_hub;
                        hash = 'real';
                        break;
                    case '11':
                        pathname = routes.traders_hub;
                        hash = 'demo';
                        break;
                    case '2':
                        pathname = routes.traders_hub;
                        break;
                    case '20':
                        pathname = routes.traders_hub;
                        hash = 'real';
                        break;
                    case '21':
                        pathname = routes.traders_hub;
                        hash = 'demo';
                        break;
                    case '3':
                        pathname = routes.passwords;
                        break;
                    default:
                        break;
                }

                if (pathname) {
                    history.push({
                        pathname,
                        hash,
                        search: url_query_string,
                    });
                    redirected_to_route = true;
                }
            }

            setResetTradingPasswordModalOpen(true);
            break;
        }
        case 'payment_withdraw': {
            if (is_next_wallet) {
                // passes verification_code through query param as we do not want to use localstorage/session storage
                // though can't use "verification_code" as name param
                // as there is general logic within client-store
                // which removes anything which resembles code=XYZ
                history.push(`${routes.wallets_withdrawal}?verification=${verification_code?.payment_withdraw}`);
            } else {
                history.push(routes.cashier_withdrawal);
            }
            redirected_to_route = true;
            break;
        }
        case 'payment_agent_withdraw': {
            history.push(routes.cashier_pa);
            redirected_to_route = true;
            break;
        }
        case 'add_account': {
            WS.wait('get_account_status').then(() => {
                if (!currency) return openRealAccountSignup('set_currency');
                return openRealAccountSignup('svg');
            });
            if (ext_platform_url) redirectToExternalPlatform(ext_platform_url);
            break;
        }
        case 'add_account_multiplier': {
            WS.wait('get_account_status').then(() => {
                if (!currency) return openRealAccountSignup('set_currency');
                return openRealAccountSignup('maltainvest');
            });
            if (ext_platform_url) redirectToExternalPlatform(ext_platform_url);
            break;
        }
        case 'manage_account': {
            WS.wait('get_account_status').then(() => {
                return openRealAccountSignup('manage');
            });
            if (ext_platform_url) redirectToExternalPlatform(ext_platform_url);
            break;
        }
        case 'verification': {
            // Removing this will break mobile DP2P app. Do not remove.
            sessionStorage.setItem('redirect_url', routes.p2p_verification);
            const new_href = loginUrl({
                language: getLanguage(),
            });
            window.location.href = new_href;
            break;
        }
        case 'trading_platform_investor_password_reset': {
            localStorage.setItem('cfd_reset_password_code', code_param);
            const is_demo = localStorage.getItem('cfd_reset_password_intent')?.includes('demo');
            history.push(`${routes.traders_hub}#${is_demo ? 'demo' : 'real'}#reset-password`);
            redirected_to_route = true;
            break;
        }
        case 'p2p_order_confirm': {
            history.push({
                pathname: routes.cashier_p2p,
                search: url_query_string,
            });
            redirected_to_route = true;
            break;
        }

        default:
            break;
    }

    if (!redirected_to_route && history.location.pathname !== routes.root) {
        history.push({
            pathname: routes.root,
            search: url_query_string,
        });
    }

    return null;
});

export default withRouter(Redirect);
