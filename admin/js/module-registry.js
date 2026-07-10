/* ============================================================
   MODULE : Admin Module Registry
   VERSION: 1.0.0
   BUILD  : 2026.07.10-admin-modular
   PURPOSE: Identifies every loaded admin feature module.
   ============================================================ */
(() => {
  'use strict';

  const modules = {
    core: {
      file: 'admin/js/app.js',
      version: '10.0.0',
      purpose: 'Authentication, Supabase loading, navigation, filters and base rendering'
    },
    workflowEditors: {
      file: 'admin/js/section-logic.js',
      version: '3.0.0',
      purpose: 'Section-owned updates, contact fields and workflow persistence'
    },
    editorCompatibility: {
      file: 'admin/js/editor-hotfix.js',
      version: '1.0.0',
      purpose: 'Ensures phone and living-place inputs are editable in workflow drawers'
    },
    assignmentShare: {
      file: 'admin/js/assignment-share.js',
      version: '1.0.0',
      purpose: 'Creates filtered self-assignment links and shows assignment timestamps'
    },
    residentGallery: {
      file: 'admin/css/compact-gallery.css',
      version: '3.0.0',
      purpose: 'Responsive compact Residents gallery'
    }
  };

  window.CampaignBuild = Object.freeze({
    id: '2026.07.10-admin-modular',
    generatedAt: '2026-07-10',
    modules: Object.freeze(modules)
  });

  console.info('[Campaign Build]', window.CampaignBuild.id, modules);
})();