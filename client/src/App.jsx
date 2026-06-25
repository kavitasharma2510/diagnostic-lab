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
import ProfileList from './pages/profiles/List';
import ProfileCreate from './pages/profiles/Create';
import ProfileEdit from './pages/profiles/Edit';
import ProfileView from './pages/profiles/View';
import PatientList from './pages/patients/List';
import PatientCreate from './pages/patients/Create';
import PatientEdit from './pages/patients/Edit';
import PatientView from './pages/patients/View';
import BillList from './pages/bills/List';
import BillCreate from './pages/bills/Create';
import BillEdit from './pages/bills/Edit';
import BillView from './pages/bills/View';
import PendingSamples from './pages/samples/PendingList';
import SampleCollect from './pages/samples/Collect';
import CollectedSamples from './pages/samples/List';
import SampleView from './pages/samples/View';
import ReportList from './pages/reports/List';
import ResultEntry from './pages/reports/ResultEntry';
import ReportPreview from './pages/reports/Preview';
import ReportVerification from './pages/reports/Verification';

export default function App() {
    const toastRef = useRef(null);

    return (
        <ToastContext.Provider value={toastRef}>
            <Toast ref={toastRef} position="top-right" />
            <ConfirmDialog />
            <Routes>
                <Route path="/" element={<Navigate to="/test-categories" replace />} />
                <Route path="/test-categories" element={<TestCategoryList />} />
                <Route path="/test-categories/create" element={<TestCategoryCreate />} />
                <Route path="/test-categories/:id" element={<TestCategoryView />} />
                <Route path="/test-categories/:id/edit" element={<TestCategoryEdit />} />
                <Route path="/lab-tests" element={<LabTestList />} />
                <Route path="/lab-tests/create" element={<LabTestCreate />} />
                <Route path="/lab-tests/:id" element={<LabTestView />} />
                <Route path="/lab-tests/:id/edit" element={<LabTestEdit />} />
                <Route path="/profiles" element={<ProfileList />} />
                <Route path="/profiles/create" element={<ProfileCreate />} />
                <Route path="/profiles/:id" element={<ProfileView />} />
                <Route path="/profiles/:id/edit" element={<ProfileEdit />} />
                <Route path="/patients" element={<PatientList />} />
                <Route path="/patients/create" element={<PatientCreate />} />
                <Route path="/patients/:id" element={<PatientView />} />
                <Route path="/patients/:id/edit" element={<PatientEdit />} />
                <Route path="/bills" element={<BillList />} />
                <Route path="/bills/create" element={<BillCreate />} />
                <Route path="/bills/:id" element={<BillView />} />
                <Route path="/bills/:id/edit" element={<BillEdit />} />
                <Route path="/samples/pending" element={<PendingSamples />} />
                <Route path="/samples/collect" element={<SampleCollect />} />
                <Route path="/samples" element={<CollectedSamples />} />
                <Route path="/samples/:id" element={<SampleView />} />
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
