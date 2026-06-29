import { Routes, Route, Navigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useRef } from 'react';
import { ToastContext } from './context/ToastContext';
import TestCategoryList from './pages/test-categories/List';
import TestCategoryCreate from './pages/test-categories/Create';
import TestCategoryEdit from './pages/test-categories/Edit';
import TestCategoryView from './pages/test-categories/View';
import LabTestList from './pages/lab-tests/List';
import LabTestCreate from './pages/lab-tests/Create';
import LabTestEdit from './pages/lab-tests/Edit';
import LabTestView from './pages/lab-tests/View';
import ReportList from './pages/reports/List';
import ResultEntry from './pages/reports/ResultEntry';
import ReportPreview from './pages/reports/Preview';
import ReportVerification from './pages/reports/Verification';
import PatientBookingCreate from './pages/booking/Create';

export default function App() {
    const toastRef = useRef(null);

    return (
        <ToastContext.Provider value={toastRef}>
            <Toast ref={toastRef} position="top-right" />
            <ConfirmDialog />
            <Routes>
                <Route path="/" element={<Navigate to="/test-categories" replace />} />
                <Route path="/booking" element={<PatientBookingCreate />} />
                <Route path="/test-categories" element={<TestCategoryList />} />
                <Route path="/test-categories/create" element={<TestCategoryCreate />} />
                <Route path="/test-categories/:id" element={<TestCategoryView />} />
                <Route path="/test-categories/:id/edit" element={<TestCategoryEdit />} />
                <Route path="/lab-tests" element={<LabTestList />} />
                <Route path="/lab-tests/create" element={<LabTestCreate />} />
                <Route path="/lab-tests/:id" element={<LabTestView />} />
                <Route path="/lab-tests/:id/edit" element={<LabTestEdit />} />
                <Route path="/reports" element={<ReportList />} />
                <Route path="/reports/entry" element={<ResultEntry />} />
                <Route path="/reports/entry/:id" element={<ResultEntry />} />
                <Route path="/reports/:id/preview" element={<ReportPreview />} />
                <Route path="/report/verify/:reportNo" element={<ReportVerification />} />
                <Route path="*" element={<Navigate to="/test-categories" replace />} />
            </Routes>
        </ToastContext.Provider>
    );
}
