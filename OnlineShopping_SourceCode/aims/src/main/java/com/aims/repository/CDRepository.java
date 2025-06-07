package com.aims.repository;

import com.aims.model.CD;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CDRepository extends JpaRepository<CD, String> {
}