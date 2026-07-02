-- ============================================================================
-- SQL Schema & Row Level Security (RLS) - SmartStock ERP POS
-- Version: Production-Ready (PostgreSQL 14+)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLES DEFINITIONS
-- ============================================================================

-- 1.1 Branches (Points de Vente)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.2 Profiles (Utilisateurs / Personnel de caisse)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Caissier', 'Directeur', 'Administrateur')),
    avatar TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.3 Products (Produits & Stocks)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(100) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    purchase_price NUMERIC(12, 2),
    selling_price NUMERIC(12, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_visible_catalog BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.4 Caisse Sessions (Gestion des Ouvertures/Fermetures de Caisse)
CREATE TABLE IF NOT EXISTS caisse_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caissier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(15, 2) NOT NULL CHECK (opening_balance >= 0),
    closing_balance_real NUMERIC(15, 2),
    closing_balance_expected NUMERIC(15, 2),
    difference NUMERIC(15, 2),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.5 Sales (Ventes / En-têtes de Ticket)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    caissier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    caisse_session_id UUID NOT NULL REFERENCES caisse_sessions(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(15, 2) DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(15, 2) DEFAULT 0 CHECK (tax >= 0),
    total_to_pay NUMERIC(15, 2) NOT NULL CHECK (total_to_pay >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('espèces', 'carte', 'mobile_money', 'mixte')),
    cash_received NUMERIC(15, 2) CHECK (cash_received >= 0),
    cash_returned NUMERIC(15, 2) CHECK (cash_returned >= 0),
    payment_details JSONB, -- Pour les détails du paiement mixte, par ex. {"cash": 5000, "card": 2000}
    customer_type VARCHAR(50) DEFAULT 'walkin' CHECK (customer_type IN ('walkin', 'corporate', 'vip')),
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.6 Sale Items (Détails des Articles Vendus)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(15, 2) DEFAULT 0 CHECK (discount >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 1.7 Suspended Sales (Ventes en Attente / Suspendues)
CREATE TABLE IF NOT EXISTS suspended_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_name VARCHAR(150) NOT NULL,
    caissier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    items_json JSONB NOT NULL, -- Contient le panier sérialisé
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.8 Returns & Exchanges (Retours / Échanges de produits)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    caissier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('total', 'partiel', 'echange')),
    total_refunded NUMERIC(15, 2) NOT NULL CHECK (total_refunded >= 0),
    items_json JSONB NOT NULL, -- Articles retournés/échangés
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.9 Stock Movements (Traçabilité des mouvements logistiques)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- Valeur positive pour réapprovisionnement/retour, négative pour vente
    type VARCHAR(50) NOT NULL CHECK (type IN ('vente', 'retour', 'reassort', 'ajustement')),
    reference_id UUID, -- ID de la vente ou du retour associé
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.10 Audit Logs (Journal d'audit de gouvernance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('access', 'error', 'policy', 'audit', 'success')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    code_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ============================================================================
-- 2. INDEXES (Optimisation des performances)
-- ============================================================================

-- Recherche rapide par Code-Barres / SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Recherche de tickets (QR Code, ticket_number, dates)
CREATE INDEX IF NOT EXISTS idx_sales_ticket_number ON sales(ticket_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Performance des clés étrangères et liaisons
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_caisse_sessions_status ON caisse_sessions(status);


-- ============================================================================
-- 3. TRIGGERS (Automatisation des flux ERP : Mise à jour des Stocks)
-- ============================================================================

-- 3.1 Fonction automatique pour ajuster le stock lors d'une vente
CREATE OR REPLACE FUNCTION handle_sale_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Créer le mouvement de stock négatif (sortie)
    INSERT INTO stock_movements (product_id, quantity, type, reference_id)
    VALUES (NEW.product_id, -NEW.quantity, 'vente', NEW.sale_id);

    -- 2. Soustraire la quantité du stock disponible du produit
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur l'ajout d'un article de vente
CREATE TRIGGER trg_sale_stock_movement
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION handle_sale_stock_movement();


-- 3.2 Fonction automatique pour ajuster le stock lors d'un retour
CREATE OR REPLACE FUNCTION handle_return_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    returned_item RECORD;
BEGIN
    -- Parcourir les articles retournés sérialisés dans le JSON
    -- Format attendu de items_json: [{"product_id": "...", "quantity": 2}, ...]
    FOR returned_item IN 
        SELECT (value->>'product_id')::UUID as product_id, (value->>'quantity')::INTEGER as quantity
        FROM jsonb_array_elements(NEW.items_json)
    LOOP
        -- 1. Créer le mouvement de stock positif (entrée)
        INSERT INTO stock_movements (product_id, quantity, type, reference_id)
        VALUES (returned_item.product_id, returned_item.quantity, 'retour', NEW.id);

        -- 2. Réintégrer la quantité dans le stock disponible
        UPDATE products
        SET stock = stock + returned_item.quantity
        WHERE id = returned_item.product_id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur l'ajout d'un retour
CREATE TRIGGER trg_return_stock_movement
AFTER INSERT ON returns
FOR EACH ROW
EXECUTE FUNCTION handle_return_stock_movement();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activation globale de la sécurité RLS sur toutes les tables sensibles
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspended_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note sur le contexte de session:
-- Les règles suivantes utilisent `current_setting('app.current_user_role', true)`
-- et `current_setting('app.current_user_branch_id', true)` pour obtenir le rôle 
-- et l'identifiant de la boutique de l'utilisateur connecté dans la session PostgreSQL.
-- Si vous utilisez Supabase, remplacez-les par auth.uid() et les métadonnées JWT correspondantes.

-- ----------------------------------------------------------------------------
-- 4.1 Règles pour les Branches
-- ----------------------------------------------------------------------------
-- Les Directeurs et Administrateurs peuvent tout voir et modifier.
-- Les Caissiers peuvent voir toutes les branches actives mais pas les éditer.
CREATE POLICY branch_view_policy ON branches
    FOR SELECT
    USING (is_active = TRUE OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

CREATE POLICY branch_admin_policy ON branches
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

-- ----------------------------------------------------------------------------
-- 4.2 Règles pour les Profils d'utilisateurs
-- ----------------------------------------------------------------------------
-- Un utilisateur peut voir son propre profil.
-- Les Directeurs et Administrateurs ont un accès total aux profils.
CREATE POLICY profile_self_and_admin_view_policy ON profiles
    FOR SELECT
    USING (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
    );

CREATE POLICY profile_admin_modify_policy ON profiles
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

-- ----------------------------------------------------------------------------
-- 4.3 Règles pour le Catalogue de Produits (Products)
-- ----------------------------------------------------------------------------
-- Tout le monde (Caissiers inclus) peut lire le catalogue et le stock disponible.
-- Seuls les Directeurs et Administrateurs peuvent ajouter, modifier ou supprimer un produit.
CREATE POLICY product_read_policy ON products
    FOR SELECT
    USING (TRUE);

CREATE POLICY product_write_policy ON products
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

-- ----------------------------------------------------------------------------
-- 4.4 Règles pour la Gestion de la Caisse (Caisse Sessions)
-- ----------------------------------------------------------------------------
-- Un Caissier peut uniquement gérer (ouvrir/fermer/consulter) ses propres sessions de caisse.
-- Le Directeur ou l'Administrateur peut voir toutes les sessions de caisse pour l'audit.
CREATE POLICY caisse_session_caissier_policy ON caisse_sessions
    FOR ALL
    USING (
        caissier_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
    );

-- ----------------------------------------------------------------------------
-- 4.5 Règles pour les Ventes (Sales & Sale Items)
-- ----------------------------------------------------------------------------
-- Les Caissiers peuvent lire et créer des ventes uniquement au sein de leur propre succursale (branch_id).
-- Les Directeurs et Administrateurs ont une visibilité multi-boutiques totale.
CREATE POLICY sales_caissier_and_director_policy ON sales
    FOR ALL
    USING (
        (current_setting('app.current_user_role', true) = 'Caissier' AND branch_id::text = current_setting('app.current_user_branch_id', true))
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
    );

CREATE POLICY sale_items_policy ON sale_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sales s
            WHERE s.id = sale_items.sale_id
            AND (
                (current_setting('app.current_user_role', true) = 'Caissier' AND s.branch_id::text = current_setting('app.current_user_branch_id', true))
                OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 4.6 Règles pour les Ventes Suspendues
-- ----------------------------------------------------------------------------
-- Un Caissier gère ses propres ventes suspendues pour sa branche.
CREATE POLICY suspended_sales_policy ON suspended_sales
    FOR ALL
    USING (
        (current_setting('app.current_user_role', true) = 'Caissier' AND caissier_id::text = current_setting('app.current_user_id', true))
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
    );

-- ----------------------------------------------------------------------------
-- 4.7 Règles pour les Retours et Échanges
-- ----------------------------------------------------------------------------
-- Les Caissiers peuvent enregistrer des retours uniquement pour leur propre succursale.
-- Les Directeurs et Administrateurs peuvent auditer/effectuer des retours partout.
CREATE POLICY returns_policy ON returns
    FOR ALL
    USING (
        (current_setting('app.current_user_role', true) = 'Caissier' AND branch_id::text = current_setting('app.current_user_branch_id', true))
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur')
    );

-- ----------------------------------------------------------------------------
-- 4.8 Règles pour la Traçabilité Logistique (Stock Movements)
-- ----------------------------------------------------------------------------
-- Tout le monde peut voir les mouvements de stock.
-- Seuls les Directeurs, Administrateurs (et le système via triggers) peuvent écrire des mouvements.
CREATE POLICY stock_movements_read_policy ON stock_movements
    FOR SELECT
    USING (TRUE);

CREATE POLICY stock_movements_write_policy ON stock_movements
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

-- ----------------------------------------------------------------------------
-- 4.9 Règles pour le Journal d'Audit (Audit Logs)
-- ----------------------------------------------------------------------------
-- Seuls les Directeurs et Administrateurs peuvent lire et analyser les logs d'audit complets.
-- Les Caissiers peuvent y insérer leurs actions d'audit mais pas les modifier ou les supprimer.
CREATE POLICY audit_logs_read_policy ON audit_logs
    FOR SELECT
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur'));

CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (TRUE);
