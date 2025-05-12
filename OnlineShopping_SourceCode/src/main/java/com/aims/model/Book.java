package com.aims.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "Books")
public class Book {

    @Id
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "authors", nullable = false)
    private String authors;

    @Column(name = "cover_type", nullable = false)
    private String coverType;

    @Column(name = "publisher", nullable = false)
    private String publisher;

    @Column(name = "publication_date", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date publicationDate;

    @Column(name = "num_pages")
    private Integer numPages;

    @Column(name = "language")
    private String language;

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

    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }

    public String getCoverType() {
        return coverType;
    }

    public void setCoverType(String coverType) {
        this.coverType = coverType;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    public Date getPublicationDate() {
        return publicationDate;
    }

    public void setPublicationDate(Date publicationDate) {
        this.publicationDate = publicationDate;
    }

    public Integer getNumPages() {
        return numPages;
    }

    public void setNumPages(Integer numPages) {
        this.numPages = numPages;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
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