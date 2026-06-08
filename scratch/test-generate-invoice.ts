import axios from 'axios';

const testInvoice = async () => {
    try {
        console.log('Logging in as doctor...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login/email', {
            email: 'bs.buithih@ehealth.vn',
            password: 'Admin@123'
        });
        
        const token = loginRes.data?.data?.accessToken ?? loginRes.data?.accessToken;
        if (!token) {
            console.error('Login failed, no token returned:', loginRes.data);
            return;
        }
        console.log('Login successful, token retrieved.');

        console.log('Attempting to generate invoice for ENC_260609_afbeb98f...');
        const res = await axios.post('http://localhost:3000/api/billing/invoices/generate/ENC_260609_afbeb98f', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Response Status:', res.status);
        console.log('Response Data:', res.data);
    } catch (err: any) {
        console.error('Error Status:', err.response?.status);
        console.error('Error Code:', err.response?.data?.error_code);
        console.error('Error Message:', err.response?.data?.message ?? err.response?.data ?? err.message);
    }
};

testInvoice();
