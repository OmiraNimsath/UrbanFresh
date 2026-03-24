package com.urbanfresh.model;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – Composite key for supplier-brand mappings.
 * Keys are supplier_id and brand_id.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class SupplierBrandId implements Serializable {

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "brand_id")
    private Long brandId;
}
