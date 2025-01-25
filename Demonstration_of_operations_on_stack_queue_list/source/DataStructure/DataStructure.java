package source.DataStructure;

import java.util.*;
import java.util.List;


public abstract class DataStructure{
    protected List<Integer> elements;

    public DataStructure() {
        elements = new ArrayList<>();
    }

    public abstract void insert(int value);
    public abstract void delete(int value);
    public abstract boolean find(int value);
    public abstract void sort();

    public List<Integer> getElements() {
        return elements;
    }

    public abstract String getType();
}