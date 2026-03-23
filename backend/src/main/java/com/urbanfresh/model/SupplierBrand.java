package com.urbanfresh.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – Join entity between supplier users and brands.
 * Encodes many-to-many ownership mapping for RBAC scoping.
 */
@Entity
@Table(name = "supplier_brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierBrand {

    @EmbeddedId
    private SupplierBrandId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("supplierId")
    @JoinColumn(name = "supplier_id", nullable = false)
    private User supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("brandId")
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;
}
