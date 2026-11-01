"""
TradeSight Export Analytics — Interactive Executive Dashboard (V1)
Cynaris Week 9 Capstone Project

Technology Stack: Streamlit, Plotly, Pandas, NumPy
Author: krupabt (Data Analyst Intern)
"""

import os
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path

# Set Streamlit Page Configuration
st.set_page_config(
    page_title="TradeSight Export Analytics — Dashboard V1",
    page_icon="🌐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS Styling for Professional Corporate Aesthetic
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #0F2027;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4A5568;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #FFFFFF;
        border-radius: 8px;
        padding: 1.2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        border-left: 4px solid #203A43;
        margin-bottom: 1rem;
    }
    .metric-title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #718096;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1A202C;
        margin-top: 0.2rem;
    }
    .metric-subtitle {
        font-size: 0.8rem;
        color: #718096;
        margin-top: 0.2rem;
    }
    .status-badge-ok {
        background-color: #C6F6D5;
        color: #22543D;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .status-badge-warn {
        background-color: #FEEBC8;
        color: #7B341E;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .status-badge-alert {
        background-color: #FED7D7;
        color: #742A2A;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_data
def load_datasets():
    """Load cleaned datasets and Week 6 buyer segmentation data."""
    base_dir = Path(__file__).resolve().parent.parent
    orders_path = base_dir / "data_processed" / "da_b2b_orders_cleaned.csv"
    rfm_path = base_dir / "week6_deep_dive" / "outputs" / "buyer_rfm_segments.csv"
    products_path = base_dir / "data_processed" / "da_product_catalogue_cleaned.csv"
    customers_path = base_dir / "data_processed" / "da_customer_profiles_cleaned.csv"

    # Fallback to local data paths if run from different working dir
    if not orders_path.exists():
        orders_path = Path("data_processed/da_b2b_orders_cleaned.csv")
        rfm_path = Path("week6_deep_dive/outputs/buyer_rfm_segments.csv")
        products_path = Path("data_processed/da_product_catalogue_cleaned.csv")
        customers_path = Path("data_processed/da_customer_profiles_cleaned.csv")

    df_orders = pd.read_csv(orders_path)
    df_orders['order_date_parsed'] = pd.to_datetime(df_orders['order_date_parsed'])
    df_orders['order_year_month'] = df_orders['order_date_parsed'].dt.strftime('%Y-%m')

    df_rfm = pd.read_csv(rfm_path) if rfm_path.exists() else pd.DataFrame()
    df_prod = pd.read_csv(products_path) if products_path.exists() else pd.DataFrame()
    df_cust = pd.read_csv(customers_path) if customers_path.exists() else pd.DataFrame()

    # Merge segmentation into orders
    if not df_rfm.empty and 'buyer_id' in df_rfm.columns:
        rfm_subset = df_rfm[['buyer_id', 'segment_label', 'cluster', 'frequency', 'recency_days', 'total_spend_inr']]
        df_merged = df_orders.merge(rfm_subset, on='buyer_id', how='left')
    else:
        df_merged = df_orders.copy()
        df_merged['segment_label'] = 'Unclassified'

    return df_merged, df_rfm, df_prod, df_cust


# Ingest Data
df_all_orders, df_rfm, df_prod, df_cust = load_datasets()

# -------------------------------------------------------------
# SIDEBAR FILTERS
# -------------------------------------------------------------
st.sidebar.image("https://img.icons8.com/fluency/96/commercial.png", width=64)
st.sidebar.title("TradeSight Analytics")
st.sidebar.markdown("**Export Management Portal** — Chennai, IN")
st.sidebar.markdown("---")

st.sidebar.subheader("Filter Controls")

# 1. Date Range Filter
min_date = df_all_orders['order_date_parsed'].min().date()
max_date = df_all_orders['order_date_parsed'].max().date()
date_selection = st.sidebar.date_input(
    "Order Date Window",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date,
    help="Filter transactions by verified order placement date."
)

if isinstance(date_selection, tuple) and len(date_selection) == 2:
    start_date, end_date = date_selection
else:
    start_date, end_date = min_date, max_date

# 2. Product Category Filter
available_categories = sorted(df_all_orders['category'].dropna().unique())
selected_categories = st.sidebar.multiselect(
    "Product Categories",
    options=available_categories,
    default=available_categories,
    help="Filter by commodity export categories."
)

# 3. Payment Terms Filter
available_terms = sorted(df_all_orders['payment_terms'].dropna().unique())
selected_terms = st.sidebar.multiselect(
    "Payment Terms",
    options=available_terms,
    default=available_terms,
    help="Filter by commercial credit terms (e.g., Net 30/60/90, Advance)."
)

# 4. Buyer Segment Filter (Week 6 Integration)
available_segments = sorted(df_all_orders['segment_label'].dropna().unique())
selected_segments = st.sidebar.multiselect(
    "Buyer RFM-V Segment",
    options=available_segments,
    default=available_segments,
    help="Filter by Week 6 K-Means RFM-V behavioral clusters."
)

# Apply Filter Mask
mask = (
    (df_all_orders['order_date_parsed'].dt.date >= start_date) &
    (df_all_orders['order_date_parsed'].dt.date <= end_date) &
    (df_all_orders['category'].isin(selected_categories)) &
    (df_all_orders['payment_terms'].isin(selected_terms)) &
    (df_all_orders['segment_label'].isin(selected_segments))
)
df_filtered = df_all_orders[mask].copy()

st.sidebar.markdown("---")
st.sidebar.markdown(f"**Filtered Volume:** {len(df_filtered):,} of {len(df_all_orders):,} orders")
if st.sidebar.button("Reset All Filters"):
    st.rerun()

st.sidebar.markdown("""
<div style='font-size:0.75rem; color:#718096; margin-top: 2rem;'>
<b>Cynaris Capstone Milestone:</b> Week 9<br>
<b>Environment:</b> Antigravity IDE<br>
<b>Repo:</b> krupabt/TradeSight-Export-Analytics
</div>
""", unsafe_allow_html=True)


# -------------------------------------------------------------
# MAIN HEADER & TAB NAVIGATION
# -------------------------------------------------------------
st.markdown("<div class='main-header'>TradeSight Export Analytics — Dashboard V1</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Executive Intelligence, Operational Logistics, Quality Exceptions & Buyer Segmentation</div>", unsafe_allow_html=True)

tabs = st.tabs([
    "📊 Executive Overview",
    "🚚 Logistics & Fulfillment",
    "📦 Returns & Exception Audit",
    "👥 Week 6 Buyer Segmentation",
    "📋 Data Governance & Missing KPIs"
])

# -------------------------------------------------------------
# TAB 1: EXECUTIVE OVERVIEW
# -------------------------------------------------------------
with tabs[0]:
    if df_filtered.empty:
        st.warning("No orders match the selected filter criteria. Please broaden your selection.")
    else:
        # Key Verified Metrics
        total_rev = df_filtered['total_value_inr'].sum()
        total_orders = len(df_filtered)
        aov = total_rev / total_orders if total_orders > 0 else 0
        total_units = df_filtered['quantity_units'].sum()
        on_time_orders = df_filtered['on_time_delivery'].sum()
        on_time_rate = (on_time_orders / total_orders * 100) if total_orders > 0 else 0
        total_returns = df_filtered['return_qty'].sum()
        return_rate = (total_returns / total_units * 100) if total_units > 0 else 0
        unique_buyers = df_filtered['buyer_id'].nunique()

        # Top Metric Cards
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        with col1:
            st.metric(
                label="Total Export Value",
                value=f"₹{total_rev / 1e7:,.2f} Cr",
                help="Sum of total_value_inr across all filtered orders."
            )
        with col2:
            st.metric(
                label="Total Orders",
                value=f"{total_orders:,}",
                help="Total count of B2B shipment orders."
            )
        with col3:
            st.metric(
                label="Avg Order Value",
                value=f"₹{aov / 1e5:,.2f} L",
                help="Average order value = Total Revenue / Total Orders."
            )
        with col4:
            st.metric(
                label="On-Time Delivery Rate",
                value=f"{on_time_rate:.2f}%",
                delta=f"{on_time_rate - 80.0:.2f}% vs SLA (80%)",
                help="Percentage of orders delivered strictly on or before committed delivery SLA."
            )
        with col5:
            st.metric(
                label="Unit Return Rate",
                value=f"{return_rate:.2f}%",
                help="Percentage of ordered commodity units returned = Total Return Units / Total Ordered Units."
            )
        with col6:
            st.metric(
                label="Active Buyers",
                value=f"{unique_buyers:,}",
                help="Count of unique commercial buyers with orders in the selected period."
            )

        st.markdown("---")

        # Visual Row 1: Monthly Trend & Category Breakdown
        vcol1, vcol2 = st.columns([3, 2])

        with vcol1:
            st.subheader("Monthly Export Revenue & Order Volume (2023–2024)")
            monthly_agg = df_filtered.groupby('order_year_month').agg(
                revenue=('total_value_inr', 'sum'),
                orders=('order_id', 'count')
            ).reset_index()

            fig_trend = go.Figure()
            fig_trend.add_trace(go.Bar(
                x=monthly_agg['order_year_month'],
                y=monthly_agg['revenue'] / 1e7,
                name="Revenue (₹ Cr)",
                marker_color="#1E3C72",
                yaxis="y"
            ))
            fig_trend.add_trace(go.Scatter(
                x=monthly_agg['order_year_month'],
                y=monthly_agg['orders'],
                name="Order Count",
                mode="lines+markers",
                marker=dict(size=6, color="#F39C12"),
                line=dict(width=2.5, color="#F39C12"),
                yaxis="y2"
            ))
            fig_trend.update_layout(
                height=380,
                margin=dict(l=20, r=20, t=30, b=20),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                yaxis=dict(title="Revenue (₹ Crore)", showgrid=True, gridcolor="#EDF2F7"),
                yaxis2=dict(title="Orders Placed", overlaying="y", side="right", showgrid=False),
                xaxis=dict(title="Order Year-Month", tickangle=-45)
            )
            st.plotly_chart(fig_trend, use_container_width=True)

        with vcol2:
            st.subheader("Revenue by Product Category")
            cat_agg = df_filtered.groupby('category')['total_value_inr'].sum().reset_index()
            cat_agg = cat_agg.sort_values(by='total_value_inr', ascending=True)

            fig_cat = px.bar(
                cat_agg,
                x='total_value_inr',
                y='category',
                orientation='h',
                labels={'total_value_inr': 'Total Value (INR)', 'category': 'Category'},
                color='total_value_inr',
                color_continuous_scale='Blues'
            )
            fig_cat.update_layout(
                height=380,
                margin=dict(l=20, r=20, t=30, b=20),
                coloraxis_showscale=False,
                xaxis=dict(showgrid=True, gridcolor="#EDF2F7")
            )
            st.plotly_chart(fig_cat, use_container_width=True)

        # Visual Row 2: Commercial Credit Terms & Repeat Buyer Ratio
        vcol3, vcol4 = st.columns(2)
        with vcol3:
            st.subheader("Commercial Payment Terms Distribution")
            terms_agg = df_filtered.groupby('payment_terms').agg(
                order_count=('order_id', 'count'),
                revenue=('total_value_inr', 'sum')
            ).reset_index()
            fig_terms = px.pie(
                terms_agg,
                names='payment_terms',
                values='order_count',
                hole=0.45,
                color_discrete_sequence=px.colors.qualitative.Prism
            )
            fig_terms.update_layout(height=320, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_terms, use_container_width=True)

        with vcol4:
            st.subheader("Repeat vs First-Time Buyer Order Distribution")
            repeat_agg = df_filtered.groupby('repeat_buyer')['order_id'].count().reset_index()
            repeat_agg['Buyer Type'] = repeat_agg['repeat_buyer'].map({1: 'Repeat Buyer (84%)', 0: 'First-Time Buyer (16%)'})
            fig_repeat = px.pie(
                repeat_agg,
                names='Buyer Type',
                values='order_id',
                hole=0.45,
                color_discrete_sequence=['#2B5876', '#4E4376']
            )
            fig_repeat.update_layout(height=320, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_repeat, use_container_width=True)


# -------------------------------------------------------------
# TAB 2: LOGISTICS & FULFILLMENT DIAGNOSTICS
# -------------------------------------------------------------
with tabs[1]:
    st.subheader("Fulfillment SLA & Logistics Performance Diagnostics")

    if df_filtered.empty:
        st.warning("No orders match filter criteria.")
    else:
        # SLA & Transit metrics
        avg_transit = df_filtered['delivery_days'].mean()
        med_transit = df_filtered['delivery_days'].median()
        delayed_orders = len(df_filtered[df_filtered['is_delayed'] == 1])
        on_time_orders = len(df_filtered[df_filtered['on_time_delivery'] == 1])
        current_sla = (on_time_orders / len(df_filtered) * 100) if len(df_filtered) > 0 else 0

        lcol1, lcol2, lcol3, lcol4 = st.columns(4)
        with lcol1:
            st.metric("Avg Transit Duration", f"{avg_transit:.2f} Days", help="Mean delivery_days across filtered shipments.")
        with lcol2:
            st.metric("Median Transit Duration", f"{med_transit:.1f} Days", help="Median delivery_days (robust to outliers).")
        with lcol3:
            st.metric("On-Time Deliveries", f"{on_time_orders:,} Orders", help="Fulfilled within SLA window.")
        with lcol4:
            st.metric("Delayed Shipments", f"{delayed_orders:,} Orders", f"{delayed_orders / len(df_filtered) * 100:.1f}% Delay Rate")

        st.markdown("---")

        fcol1, fcol2 = st.columns(2)
        with fcol1:
            st.subheader("Category On-Time Delivery Rate (%) vs 80% SLA Target")
            cat_sla = df_filtered.groupby('category').agg(
                total_orders=('order_id', 'count'),
                on_time=('on_time_delivery', 'sum')
            ).reset_index()
            cat_sla['sla_rate'] = (cat_sla['on_time'] / cat_sla['total_orders']) * 100
            cat_sla = cat_sla.sort_values(by='sla_rate', ascending=True)

            fig_sla = px.bar(
                cat_sla,
                x='sla_rate',
                y='category',
                orientation='h',
                labels={'sla_rate': 'On-Time Rate (%)', 'category': 'Product Category'},
                color='sla_rate',
                color_continuous_scale='Tealgrn'
            )
            # Add target reference line
            fig_sla.add_vline(x=80.0, line_dash="dash", line_color="#E53E3E", annotation_text="80% Target SLA", annotation_position="top right")
            fig_sla.update_layout(height=360, coloraxis_showscale=False, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_sla, use_container_width=True)

        with fcol2:
            st.subheader("Transit Duration Distribution (Delivery Days)")
            fig_hist = px.histogram(
                df_filtered,
                x='delivery_days',
                color='on_time_delivery',
                barmode='overlay',
                nbins=25,
                labels={'delivery_days': 'Delivery Days', 'on_time_delivery': 'On-Time (1=Yes, 0=No)'},
                color_discrete_map={1: '#319795', 0: '#E53E3E'}
            )
            fig_hist.update_layout(height=360, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_hist, use_container_width=True)

        st.subheader("Fulfillment Diagnostics by Payment Terms & Risk Profile")
        pt_perf = df_filtered.groupby('payment_terms').agg(
            total_orders=('order_id', 'count'),
            on_time_orders=('on_time_delivery', 'sum'),
            avg_delivery_days=('delivery_days', 'mean'),
            return_rate_pct=('return_qty', lambda s: (s.sum() / df_filtered.loc[s.index, 'quantity_units'].sum()) * 100)
        ).reset_index()
        pt_perf['on_time_pct'] = (pt_perf['on_time_orders'] / pt_perf['total_orders']) * 100
        pt_perf['avg_delivery_days'] = pt_perf['avg_delivery_days'].round(2)
        pt_perf['on_time_pct'] = pt_perf['on_time_pct'].round(2)
        pt_perf['return_rate_pct'] = pt_perf['return_rate_pct'].round(2)

        st.dataframe(
            pt_perf.rename(columns={
                'payment_terms': 'Payment Terms',
                'total_orders': 'Total Orders',
                'on_time_orders': 'On-Time Orders',
                'avg_delivery_days': 'Avg Delivery Days',
                'on_time_pct': 'On-Time %',
                'return_rate_pct': 'Unit Return %'
            }),
            use_container_width=True,
            hide_index=True
        )


# -------------------------------------------------------------
# TAB 3: RETURNS & EXCEPTION AUDIT
# -------------------------------------------------------------
with tabs[2]:
    st.subheader("Cargo Returns & Quality Exception Audit")

    if df_filtered.empty:
        st.warning("No orders match filter criteria.")
    else:
        tot_ordered_units = df_filtered['quantity_units'].sum()
        tot_returned_units = df_filtered['return_qty'].sum()
        orders_with_returns = len(df_filtered[df_filtered['return_qty'] > 0])
        overall_ret_pct = (tot_returned_units / tot_ordered_units * 100) if tot_ordered_units > 0 else 0
        overrun_anomalies = len(df_filtered[df_filtered['is_valid_return'] == False])

        rcol1, rcol2, rcol3, rcol4 = st.columns(4)
        with rcol1:
            st.metric("Total Ordered Units", f"{tot_ordered_units:,}", help="Total physical units shipped across all orders.")
        with rcol2:
            st.metric("Total Returned Units", f"{tot_returned_units:,}", help="Total physical units returned by buyers.")
        with rcol3:
            st.metric("Overall Return Rate", f"{overall_ret_pct:.2f}%", help="Total returns / total ordered units.")
        with rcol4:
            st.metric("Severe Return Overruns", f"{overrun_anomalies} Orders", help="Records where returned units exceed shipped quantity.")

        st.markdown("---")

        r_fig_col1, r_fig_col2 = st.columns(2)
        with r_fig_col1:
            st.subheader("Return Rate (%) by Category")
            cat_ret = df_filtered.groupby('category').agg(
                ordered=('quantity_units', 'sum'),
                returned=('return_qty', 'sum')
            ).reset_index()
            cat_ret['return_pct'] = (cat_ret['returned'] / cat_ret['ordered']) * 100
            cat_ret = cat_ret.sort_values(by='return_pct', ascending=False)

            fig_ret_cat = px.bar(
                cat_ret,
                x='category',
                y='return_pct',
                labels={'category': 'Product Category', 'return_pct': 'Unit Return Rate (%)'},
                color='return_pct',
                color_continuous_scale='Reds'
            )
            fig_ret_cat.update_layout(height=350, coloraxis_showscale=False, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_ret_cat, use_container_width=True)

        with r_fig_col2:
            st.subheader("Returned Units vs Total Shipped Units by Category")
            fig_units = go.Figure()
            fig_units.add_trace(go.Bar(name='Ordered Units', x=cat_ret['category'], y=cat_ret['ordered'], marker_color='#4A5568'))
            fig_units.add_trace(go.Bar(name='Returned Units', x=cat_ret['category'], y=cat_ret['returned'], marker_color='#E53E3E'))
            fig_units.update_layout(barmode='group', height=350, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_units, use_container_width=True)

        # Audit Exception Grid
        st.subheader("⚠️ Critical Audit Exception Grid: Suspicious Return Overruns")
        st.info("The automated data pipeline flagged the following order records where return_qty strictly exceeds quantity_units. "
                "These records represent either upstream ERP entry transposition errors or physical inventory fraud.")

        anomalies_df = df_filtered[df_filtered['is_valid_return'] == False][
            ['order_id', 'buyer_id', 'category', 'order_date', 'quantity_units', 'return_qty', 'unit_price_inr', 'total_value_inr', 'data_quality_flag']
        ]

        if not anomalies_df.empty:
            st.dataframe(anomalies_df, use_container_width=True, hide_index=True)
        else:
            st.success("No return overrun anomalies found in the currently filtered subset.")


# -------------------------------------------------------------
# TAB 4: WEEK 6 BUYER SEGMENTATION
# -------------------------------------------------------------
with tabs[3]:
    st.subheader("Week 6 Deep-Dive Integration: Commercial Buyer RFM-V Clusters")
    st.markdown("Commercial buyer segmentation based on unsupervised K-Means ($k=4$) RFM-V modeling on 187 unique buyers.")

    if not df_rfm.empty:
        # Cluster Summary Cards
        sc1, sc2, sc3, sc4 = st.columns(4)
        with sc1:
            st.markdown("""
            <div class='metric-card' style='border-left-color: #2B6CB0;'>
                <div class='metric-title'>Core Stable Accounts</div>
                <div class='metric-value'>75 Buyers</div>
                <div class='metric-subtitle'>High fulfillment (81.6%), moderate velocity, core revenue baseline.</div>
            </div>
            """, unsafe_allow_html=True)
        with sc2:
            st.markdown("""
            <div class='metric-card' style='border-left-color: #2F855A;'>
                <div class='metric-title'>Active Growth Buyers</div>
                <div class='metric-value'>68 Buyers</div>
                <div class='metric-subtitle'>High velocity, repeat commercial orders, strong volume drivers.</div>
            </div>
            """, unsafe_allow_html=True)
        with sc3:
            st.markdown("""
            <div class='metric-card' style='border-left-color: #DD6B20;'>
                <div class='metric-title'>Operationally Vulnerable</div>
                <div class='metric-value'>27 Buyers</div>
                <div class='metric-subtitle'>High operational friction, elevated transit delays (25.9%), returns.</div>
            </div>
            """, unsafe_allow_html=True)
        with sc4:
            st.markdown("""
            <div class='metric-card' style='border-left-color: #E53E3E;'>
                <div class='metric-title'>Lapsed Accounts (Dormant)</div>
                <div class='metric-value'>17 Buyers</div>
                <div class='metric-subtitle'>Extended inactivity (>500 days recency), high churn risk.</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        bcol1, bcol2 = st.columns(2)
        with bcol1:
            st.subheader("2D PCA Behavioral Projection of Buyer Clusters")
            if 'pca_x' in df_rfm.columns and 'pca_y' in df_rfm.columns:
                fig_pca = px.scatter(
                    df_rfm,
                    x='pca_x',
                    y='pca_y',
                    color='segment_label',
                    hover_name='buyer_id',
                    hover_data=['frequency', 'total_spend_inr', 'on_time_rate', 'unit_return_rate'],
                    labels={'pca_x': 'PCA Dimension 1 (Fulfillment & Volume)', 'pca_y': 'PCA Dimension 2 (Recency & Risk)'},
                    color_discrete_map={
                        'Core Stable Accounts (High Fulfillment)': '#2B6CB0',
                        'Active Growth Buyers (High Velocity)': '#2F855A',
                        'Operationally Vulnerable (High Friction)': '#DD6B20',
                        'Lapsed Accounts (Dormant)': '#E53E3E'
                    }
                )
                fig_pca.update_layout(height=400, margin=dict(l=20, r=20, t=20, b=20), legend=dict(orientation="h", y=-0.25))
                st.plotly_chart(fig_pca, use_container_width=True)
            else:
                st.info("PCA dimensions not found in buyer segmentation dataset.")

        with bcol2:
            st.subheader("Average Order Value & On-Time Rate by Segment")
            seg_profile = df_rfm.groupby('segment_label').agg(
                avg_spend=('total_spend_inr', 'mean'),
                avg_on_time=('on_time_rate', 'mean'),
                avg_returns=('unit_return_rate', 'mean')
            ).reset_index()

            fig_seg_bar = px.bar(
                seg_profile,
                x='segment_label',
                y='avg_spend',
                labels={'segment_label': 'Buyer Segment', 'avg_spend': 'Avg Spend per Buyer (INR)'},
                color='avg_on_time',
                color_continuous_scale='Viridis',
                title="Total Spend with Color by On-Time Delivery Rate"
            )
            fig_seg_bar.update_layout(height=400, margin=dict(l=20, r=20, t=40, b=40), xaxis_tickangle=-15)
            st.plotly_chart(fig_seg_bar, use_container_width=True)

        st.subheader("Commercial Buyer Profile Explorer")
        st.dataframe(
            df_rfm[[
                'buyer_id', 'segment_label', 'frequency', 'total_spend_inr', 'avg_order_value_inr',
                'recency_days', 'on_time_rate', 'unit_return_rate', 'primary_category', 'primary_payment_term'
            ]].rename(columns={
                'buyer_id': 'Buyer ID',
                'segment_label': 'RFM Segment',
                'frequency': 'Orders',
                'total_spend_inr': 'Total Spend (₹)',
                'avg_order_value_inr': 'AOV (₹)',
                'recency_days': 'Recency (Days)',
                'on_time_rate': 'On-Time %',
                'unit_return_rate': 'Return %',
                'primary_category': 'Primary Category',
                'primary_payment_term': 'Primary Terms'
            }),
            use_container_width=True,
            hide_index=True
        )
    else:
        st.warning("Week 6 buyer segmentation data not found at expected location.")


# -------------------------------------------------------------
# TAB 5: DATA GOVERNANCE & MISSING INFORMATION AUDIT
# -------------------------------------------------------------
with tabs[4]:
    st.subheader("Data Quality, Governance & Gap Analysis")
    st.markdown("A rigorous data audit conducted during Week 3 and confirmed in Week 6 identified critical data discrepancies and schema gaps. "
                "In compliance with enterprise auditing guidelines, unavailable KPIs are explicitly documented rather than synthetically fabricated.")

    gcol1, gcol2 = st.columns(2)

    with gcol1:
        st.markdown("""
        ### ❌ Missing Business Metrics Audit
        
        #### 1. Foreign Exchange (FX) Impact
        * **Required by Brief:** Foreign exchange variance analysis across 12 export destination countries.
        * **Audit Finding:** **Unavailable.** All orders are denominated purely in Indian Rupees (`INR`), with no currency field (`currency_code`), no exchange spot rate, no settlement rate, and no country of export field in `da_b2b_orders.csv`.
        * **Recommendation:** Integrate ISO country code and multi-currency billing fields in the ERP transaction capture schema.
        
        #### 2. Client Profitability & Unit Cost of Goods Sold (COGS)
        * **Required by Brief:** Client gross and net profitability margins.
        * **Audit Finding:** **Unavailable.** The orders dataset contains `unit_price_inr` and `total_value_inr`, but completely lacks unit production costs (`cogs_inr`), shipping tariffs, freight charges, or export duties. While the retail `da_product_catalogue.csv` contains retail margins, it lacks order-line SKU foreign keys to connect with B2B bulk orders.
        * **Recommendation:** Create a transactional `order_line_items` table with foreign key references to product SKU IDs and landed cost fields.
        
        #### 3. Export Compliance & Customs Audit Logs
        * **Required by Brief:** Compliance exceptions and regulatory clearance tracking.
        * **Audit Finding:** **Unavailable.** The datasets contain zero regulatory attributes (e.g., Shipping Bill numbers, Harmonized System / HS codes, Port of Loading, GST Export invoicing, or Customs Inspection flags).
        * **Recommendation:** Implement a customs documentation sub-module linking port clearances to export order IDs.
        """)

    with gcol2:
        st.markdown("""
        ### ✅ Verified Available Metrics
        
        | Domain | Metric Name | Verified Value (All Data) | Definition |
        | :--- | :--- | :--- | :--- |
        | **Commercial** | Total Export Revenue | ₹3,972,709,300 | Sum of `total_value_inr` across 600 orders |
        | **Commercial** | Total Orders Placed | 600 Orders | Transaction count in 2023–2024 |
        | **Commercial** | Average Order Value | ₹6,621,182.17 | Total revenue / total orders |
        | **Logistics** | On-Time Delivery Rate | 78.67% (472 / 600) | Proportion where `on_time_delivery = 1` |
        | **Logistics** | Transit Duration Mean | 18.29 Days | Average `delivery_days` |
        | **Logistics** | Transit Duration Median| 18.00 Days | Median `delivery_days` |
        | **Quality** | Unit Return Rate | 5.00% (16,634 / 332,698) | Total returned units / ordered units |
        | **Quality** | Return Overrun Flags | 2 Orders (0.33%) | Orders where `return_qty > quantity_units` |
        | **Buyers** | Unique Buyers | 187 Buyers | Distinct commercial buyer IDs |
        | **Buyers** | Repeat Buyer Share | 84.00% (504 / 600) | Orders from repeat buyers |
        """)

        st.markdown("""
        ### 📥 Filtered Data Export
        Export the current filtered transaction dataset for external offline validation or regulatory filing:
        """)
        csv_data = df_filtered.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download Filtered Orders CSV",
            data=csv_data,
            file_name="tradesight_filtered_orders.csv",
            mime="text/csv",
            help="Download the filtered slice of B2B orders currently displayed on this dashboard."
        )

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #A0AEC0; font-size: 0.8rem; padding: 1rem;'>
TradeSight Export Analytics Capstone — Built with Streamlit, Plotly & Pandas | Cynaris Data Analyst Internship Week 9
</div>
""", unsafe_allow_html=True)
