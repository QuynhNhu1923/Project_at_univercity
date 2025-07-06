package com.aims.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "DVDs")
public class DVD {

    @Id
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "disc_type", nullable = false)
    private String discType;

    @Column(name = "director", nullable = false)
    private String director;

    @Column(name = "runtime", nullable = false)
    private Integer runtime;

    @Column(name = "studio", nullable = false)
    private String studio;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "subtitles")
    private String subtitles;

    @Column(name = "release_date")
    private LocalDateTime releaseDate;

    @Column(name = "genre")
    private String genre;

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

    public String getDiscType() {
        return discType;
    }

    public void setDiscType(String discType) {
        this.discType = discType;
    }

    public String getDirector() {
        return director;
    }

    public void setDirector(String director) {
        this.director = director;
    }

    public Integer getRuntime() {
        return runtime;
    }

    public void setRuntime(Integer runtime) {
        this.runtime = runtime;
    }

    public String getStudio() {
        return studio;
    }

    public void setStudio(String studio) {
        this.studio = studio;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSubtitles() {
        return subtitles;
    }

    public void setSubtitles(String subtitles) {
        this.subtitles = subtitles;
    }

    public LocalDateTime getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDateTime releaseDate) {
        this.releaseDate = releaseDate;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }
}