--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-08-14 15:49:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 240 (class 1255 OID 21684)
-- Name: add_comment(integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.add_comment(IN p_review_id integer, IN p_member_id integer, IN p_comment_text text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO comment (review_id, member_id, comment_text, created_at)
    VALUES (p_review_id, p_member_id, p_comment_text, CURRENT_TIMESTAMP);
END;
$$;


--
-- TOC entry 241 (class 1255 OID 21685)
-- Name: create_comment(integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_comment(p_review_id integer, p_member_id integer, p_comment_text text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO comment (review_id, member_id, comment_text)
    VALUES (p_review_id, p_member_id, p_comment_text);
END;
$$;


--
-- TOC entry 242 (class 1255 OID 21686)
-- Name: create_review(integer, integer, text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_review(IN p_member_id integer, IN p_product_id integer, IN p_review_text text, IN p_rating integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO review (member_id, product_id, review_text, rating)
    VALUES (p_member_id, p_product_id, p_review_text, p_rating);
END;
$$;


--
-- TOC entry 243 (class 1255 OID 21687)
-- Name: delete_comment(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_comment(IN p_comment_id integer, IN p_requesting_member_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_owner_id INT;
BEGIN
    SELECT member_id INTO v_owner_id
    FROM comment
    WHERE id = p_comment_id;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found.';
    ELSIF v_owner_id != p_requesting_member_id THEN
        RAISE EXCEPTION 'You do not have permission to delete this comment.';
    END IF;

    DELETE FROM comment
    WHERE id = p_comment_id;
END;
$$;


--
-- TOC entry 244 (class 1255 OID 21688)
-- Name: get_comments_by_product(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_comments_by_product(p_product_id integer) RETURNS TABLE(comment_id integer, review_id integer, member_id integer, comment_text text, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.review_id, c.member_id, c.comment_text, c.created_at
    FROM comment c
    INNER JOIN review r ON c.review_id = r.id
    WHERE r.product_id = p_product_id
    ORDER BY c.created_at ASC;
END;
$$;


--
-- TOC entry 245 (class 1255 OID 21689)
-- Name: get_reviews_by_product(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_reviews_by_product(p_product_id integer) RETURNS TABLE(id integer, "memberId" integer, username character varying, "productId" integer, "reviewText" text, rating integer, "createdAt" timestamp without time zone, "updatedAt" timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.member_id AS "memberId",
        m.username,
        r.product_id AS "productId",
        r.review_text AS "reviewText",
        r.rating,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
    FROM review r
    JOIN member m ON r.member_id = m.id
    WHERE r.product_id = p_product_id
    ORDER BY r.updated_at DESC;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 26703)
-- Name: place_order(bigint); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_order(IN p_member_id bigint, OUT p_order_id bigint, OUT p_message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cart_id BIGINT;
    v_cart_item RECORD;
    v_order_created BOOLEAN := FALSE;
    v_any_items_processed BOOLEAN := FALSE;
BEGIN
    -- Get the cart ID for the member
    SELECT cart_id INTO v_cart_id FROM cart WHERE member_id = p_member_id;
    
    IF v_cart_id IS NULL THEN
        p_message := 'No cart found for member.';
        RETURN;
    END IF;
    
    -- Create a new sale order (without total_amount)
    INSERT INTO sale_order (member_id, order_datetime, status)
    VALUES (p_member_id, NOW(), 'PACKING')
    RETURNING id INTO p_order_id;
    
    v_order_created := TRUE;
    
    -- Process each item in the cart
    FOR v_cart_item IN 
        SELECT 
            ci.cart_item_id, 
            ci.product_id, 
            ci.quantity, 
            p.stock_quantity
        FROM cart_item ci
        JOIN product p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    LOOP
        -- Check stock availability
        IF v_cart_item.stock_quantity >= v_cart_item.quantity THEN
            -- Deduct stock
            UPDATE product 
            SET stock_quantity = stock_quantity - v_cart_item.quantity
            WHERE id = v_cart_item.product_id;
            
            -- Add to order items (without unit_price)
            INSERT INTO sale_order_item (sale_order_id, product_id, quantity)
            VALUES (p_order_id, v_cart_item.product_id, v_cart_item.quantity);
            
            -- Remove from cart
            DELETE FROM cart_item WHERE cart_item_id = v_cart_item.cart_item_id;
            
            v_any_items_processed := TRUE;
        END IF;
    END LOOP;
    
    IF NOT v_any_items_processed THEN
        -- No items processed - rollback order creation
        IF v_order_created THEN
            DELETE FROM sale_order WHERE id = p_order_id;
            p_order_id := NULL;
        END IF;
        p_message := 'No items could be processed due to insufficient stock.';
    ELSE
        p_message := 'Order placed successfully with available items.';
    END IF;
    
    -- Update cart timestamp
    UPDATE cart SET updated_at = NOW() WHERE cart_id = v_cart_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Automatic rollback happens on error
        p_order_id := NULL;
        p_message := 'Error processing order: ' || SQLERRM;
END;
$$;


--
-- TOC entry 231 (class 1259 OID 24958)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 25406)
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    member_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    discount_rule_id integer
);


--
-- TOC entry 236 (class 1259 OID 25405)
-- Name: cart_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 236
-- Name: cart_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;


--
-- TOC entry 239 (class 1259 OID 25414)
-- Name: cart_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_item (
    cart_item_id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL
);


--
-- TOC entry 238 (class 1259 OID 25413)
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_item_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 238
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_item_cart_item_id_seq OWNED BY public.cart_item.cart_item_id;


--
-- TOC entry 217 (class 1259 OID 21690)
-- Name: comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment (
    id integer NOT NULL,
    review_id integer NOT NULL,
    member_id integer NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 218 (class 1259 OID 21696)
-- Name: comment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 218
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_id_seq OWNED BY public.comment.id;


--
-- TOC entry 233 (class 1259 OID 25388)
-- Name: discount_rule_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_rule_products (
    id integer NOT NULL,
    discount_rule_id integer NOT NULL,
    product_id integer NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 25387)
-- Name: discount_rule_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_rule_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 232
-- Name: discount_rule_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_rule_products_id_seq OWNED BY public.discount_rule_products.id;


--
-- TOC entry 235 (class 1259 OID 25395)
-- Name: discount_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_rules (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    product_id integer,
    min_quantity integer,
    min_cart_value numeric,
    discount_percentage numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 25394)
-- Name: discount_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 234
-- Name: discount_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_rules_id_seq OWNED BY public.discount_rules.id;


--
-- TOC entry 219 (class 1259 OID 21697)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    dob date NOT NULL,
    password character varying(255) NOT NULL,
    role integer NOT NULL,
    gender character(1) NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 21700)
-- Name: member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5025 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_id_seq OWNED BY public.member.id;


--
-- TOC entry 221 (class 1259 OID 21701)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    id integer NOT NULL,
    name character varying(25)
);


--
-- TOC entry 222 (class 1259 OID 21704)
-- Name: member_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5026 (class 0 OID 0)
-- Dependencies: 222
-- Name: member_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_role_id_seq OWNED BY public.member_role.id;


--
-- TOC entry 223 (class 1259 OID 21705)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name character varying(255),
    description text,
    unit_price numeric NOT NULL,
    stock_quantity numeric DEFAULT 0 NOT NULL,
    country character varying(100),
    product_type character varying(50),
    image_url character varying(255) DEFAULT '/images/product.png'::character varying,
    manufactured_on timestamp without time zone
);


--
-- TOC entry 224 (class 1259 OID 21712)
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5027 (class 0 OID 0)
-- Dependencies: 224
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- TOC entry 225 (class 1259 OID 21713)
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    review_text text NOT NULL,
    rating integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 226 (class 1259 OID 21721)
-- Name: review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5028 (class 0 OID 0)
-- Dependencies: 226
-- Name: review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_id_seq OWNED BY public.review.id;


--
-- TOC entry 227 (class 1259 OID 21722)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    id integer NOT NULL,
    member_id integer,
    order_datetime timestamp without time zone NOT NULL,
    status character varying(10)
);


--
-- TOC entry 228 (class 1259 OID 21725)
-- Name: sale_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5029 (class 0 OID 0)
-- Dependencies: 228
-- Name: sale_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_id_seq OWNED BY public.sale_order.id;


--
-- TOC entry 229 (class 1259 OID 21726)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    id integer NOT NULL,
    sale_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 21731)
-- Name: sale_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5030 (class 0 OID 0)
-- Dependencies: 230
-- Name: sale_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_id_seq OWNED BY public.sale_order_item.id;


--
-- TOC entry 4821 (class 2604 OID 25409)
-- Name: cart cart_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 25417)
-- Name: cart_item cart_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_item_cart_item_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 21732)
-- Name: comment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment ALTER COLUMN id SET DEFAULT nextval('public.comment_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 25391)
-- Name: discount_rule_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_products ALTER COLUMN id SET DEFAULT nextval('public.discount_rule_products_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 25398)
-- Name: discount_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules ALTER COLUMN id SET DEFAULT nextval('public.discount_rules_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 21733)
-- Name: member id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN id SET DEFAULT nextval('public.member_id_seq'::regclass);


--
-- TOC entry 4806 (class 2604 OID 21734)
-- Name: member_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role ALTER COLUMN id SET DEFAULT nextval('public.member_role_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 21735)
-- Name: product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 21736)
-- Name: review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review ALTER COLUMN id SET DEFAULT nextval('public.review_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 21737)
-- Name: sale_order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN id SET DEFAULT nextval('public.sale_order_id_seq'::regclass);


--
-- TOC entry 4814 (class 2604 OID 21738)
-- Name: sale_order_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN id SET DEFAULT nextval('public.sale_order_item_id_seq'::regclass);


--
-- TOC entry 4844 (class 2606 OID 24966)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4855 (class 2606 OID 25419)
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 4852 (class 2606 OID 25412)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);


--
-- TOC entry 4826 (class 2606 OID 21740)
-- Name: comment comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);


--
-- TOC entry 4847 (class 2606 OID 25393)
-- Name: discount_rule_products discount_rule_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_products
    ADD CONSTRAINT discount_rule_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 25404)
-- Name: discount_rules discount_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4828 (class 2606 OID 21742)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4830 (class 2606 OID 21744)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- TOC entry 4834 (class 2606 OID 21746)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (id);


--
-- TOC entry 4832 (class 2606 OID 21748)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4836 (class 2606 OID 21750)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 21752)
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 21754)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 21756)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 1259 OID 25714)
-- Name: cart_item_cart_id_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cart_item_cart_id_product_id_key ON public.cart_item USING btree (cart_id, product_id);


--
-- TOC entry 4850 (class 1259 OID 25420)
-- Name: cart_member_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cart_member_id_key ON public.cart USING btree (member_id);


--
-- TOC entry 4845 (class 1259 OID 26345)
-- Name: discount_rule_products_discount_rule_id_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX discount_rule_products_discount_rule_id_product_id_key ON public.discount_rule_products USING btree (discount_rule_id, product_id);


--
-- TOC entry 4866 (class 2606 OID 26688)
-- Name: cart cart_discount_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_discount_rule_id_fkey FOREIGN KEY (discount_rule_id) REFERENCES public.discount_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4868 (class 2606 OID 25421)
-- Name: cart_item cart_item_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 25720)
-- Name: cart_item cart_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4867 (class 2606 OID 25715)
-- Name: cart cart_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4856 (class 2606 OID 21757)
-- Name: comment comment_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4857 (class 2606 OID 21762)
-- Name: comment comment_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(id) ON DELETE CASCADE;


--
-- TOC entry 4864 (class 2606 OID 26346)
-- Name: discount_rule_products discount_rule_products_discount_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_products
    ADD CONSTRAINT discount_rule_products_discount_rule_id_fkey FOREIGN KEY (discount_rule_id) REFERENCES public.discount_rules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4865 (class 2606 OID 26351)
-- Name: discount_rule_products discount_rule_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_products
    ADD CONSTRAINT discount_rule_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4858 (class 2606 OID 21767)
-- Name: member fk_member_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT fk_member_role_id FOREIGN KEY (role) REFERENCES public.member_role(id);


--
-- TOC entry 4862 (class 2606 OID 21772)
-- Name: sale_order_item fk_sale_order_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4863 (class 2606 OID 21777)
-- Name: sale_order_item fk_sale_order_item_sale_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_sale_order FOREIGN KEY (sale_order_id) REFERENCES public.sale_order(id);


--
-- TOC entry 4861 (class 2606 OID 21782)
-- Name: sale_order fk_sale_order_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT fk_sale_order_member FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4859 (class 2606 OID 21787)
-- Name: review review_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4860 (class 2606 OID 21792)
-- Name: review review_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


-- Completed on 2025-08-14 15:49:24

--
-- PostgreSQL database dump complete
--

