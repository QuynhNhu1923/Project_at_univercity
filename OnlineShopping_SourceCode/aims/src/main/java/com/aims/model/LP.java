package com.aims.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "LPs")
public class LP {

    @Id
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "artists", nullable = false)
    private String artists;

    @Column(name = "record_label", nullable = false)
    private String recordLabel;

    @Column(name = "tracklist", nullable = false)
    private String tracklist;

    @Column(name = "genre")
    private String genre;

    @Column(name = "release_date")
    @Temporal(TemporalType.DATE)
    private Date releaseDate;

    @OneToOne
    @MapsId
    @JoinColumn(name = "barcode")
    private Product product;

    // Getters and setters
    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getArtists() {
        return artists;
    }

    public void setArtists(String artists) {
        this.artists = artists;
    }

    public String getRecordLabel() {
        return recordLabel;
    }

    public void setRecordLabel(String recordLabel) {
        this.recordLabel = recordLabel;
    }

    public String getTracklist() {
        return tracklist;
    }

    public void setTracklist(String tracklist) {
        this.tracklist = tracklist;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public Date getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(Date releaseDate) {
        this.releaseDate = releaseDate;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }
}