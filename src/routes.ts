const routes = [
    {
        path: '/',
        component: () => import("./pages/HomeView.vue")
    },
    {
        path: '/project/:location',
        component: () => import("./pages/ProjectMain.vue")
    },
    {
        path: '/describe',
        component: () => import("./pages/DescribeView.vue")
    },
    {
        path: '/install',
        component: () => import("./pages/InstallView.vue")
    },
    {
        path: '/structure',
        component: () => import("./pages/StructureView.vue")
    }
];

export default routes;