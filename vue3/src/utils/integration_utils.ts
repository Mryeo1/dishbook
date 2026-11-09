

export type Integration = {
    id: string,
    name: string,
    import: boolean,
    export: boolean,
    helpUrl: string,
    imgSrc?: string,
}

export const INTEGRATIONS: Array<Integration> = [
    {id: 'DEFAULT', name: "Tandoor", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md', imgSrc: '/static/assets/logo_color_512.png'},
    {id: 'CHEFTAP', name: "Cheftap", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'CHOWDOWN', name: "Chowdown", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'COOKBOOKAPP', name: "CookBookApp", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'COOKLANG', name: "Cooklang Markdown", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'COOKMATE', name: "Cookmate", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'COPYMETHAT', name: "CopyMeThat", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'DOMESTICA', name: "Domestica", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'MEALIE', name: "Mealie 0.x", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'MEALIE1', name: "Mealie 1.x", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'MEALMASTER', name: "Mealmaster", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'MELARECIPES', name: "Melarecipes", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'NEXTCLOUD', name: "Nextcloud Cookbook", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'OPENEATS', name: "Openeats", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'PAPRIKA', name: "Paprika", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'PEPPERPLATE', name: "Pepperplate", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'PLANTOEAT', name: "Plantoeat", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'RECETTETEK', name: "RecetteTek", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'RECIPEKEEPER', name: "Recipekeeper", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'RECIPESAGE', name: "Recipesage", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'REZKONV', name: "Rezkonv", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'SAFFRON', name: "Saffron", import: true, export: true, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'REZEPTSUITEDE', name: "Rezeptsuite.de", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'GOURMET', name: "Gourmet", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
    {id: 'PESTLE', name: "Pestle", import: true, export: false, helpUrl: 'https://github.com/Mryeo1/dishbook/blob/main/docs/features/import_export.md'},
]
