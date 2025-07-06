package com.aims.repository;

import com.aims.model.DVD;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DVDRepository extends JpaRepository<DVD, String> {
}